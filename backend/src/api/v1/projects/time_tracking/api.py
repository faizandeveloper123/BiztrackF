from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional
import json
import uuid
from datetime import datetime, timedelta

from .....models.user_models import TeamMember
from .....models.hrm_models import TimeEntry, TimeEntryCreate, TimeEntryUpdate, HRMTimeEntriesResponse
from .....config.database import (
    get_db, get_user_by_id,
    get_time_entries, get_time_entry_by_id, create_time_entry, update_time_entry, delete_time_entry,
    User,
)
from .....models.projects import Project as DBProject, Task as DBTask
from .....config.hrm_models import TimeEntry as DBTimeEntry, Employee as DBEmployee
from .....api.dependencies import get_current_user, get_tenant_context, require_permission, can_see_all_tasks
from .....models.common import ModulePermission
from .....services.task_time_service import sync_task_actual_hours, check_and_send_task_time_reminder
from ..items import logic as project_logic
from ...tasks.items import logic as task_logic

router = APIRouter(prefix="/projects", tags=["projects"])

def transform_db_time_entry_to_pydantic(db_entry: DBTimeEntry) -> TimeEntry:
    """Transform SQLAlchemy TimeEntry to Pydantic TimeEntry"""
    return TimeEntry(
        id=str(db_entry.id),
        employeeId=str(db_entry.employeeId),
        date=db_entry.date.isoformat() if db_entry.date else "",
        clockIn=db_entry.startTime.isoformat() if db_entry.startTime else "",
        clockOut=db_entry.endTime.isoformat() if db_entry.endTime else None,
        totalHours=db_entry.hours if db_entry.hours else None,
        overtimeHours=None,
        projectId=str(db_entry.projectId) if db_entry.projectId else None,
        taskId=str(db_entry.taskId) if db_entry.taskId else None,
        notes=db_entry.description,
        status="active" if db_entry.endTime is None else "completed",
        tenant_id=str(db_entry.tenant_id),
        createdBy=str(db_entry.createdAt) if db_entry.createdAt else "",
        createdAt=db_entry.createdAt.isoformat() if db_entry.createdAt else "",
        updatedAt=db_entry.updatedAt.isoformat() if db_entry.updatedAt else ""
    )

@router.get("/time-entries", response_model=HRMTimeEntriesResponse)
async def get_project_time_entries(
    employee_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_VIEW.value))
):
    """Get all time entries with optional filtering"""
    try:
        skip = (page - 1) * limit
        time_entries = get_time_entries(db, tenant_context["tenant_id"] if tenant_context else None, skip, limit)
        
        if employee_id or start_date or end_date or project_id:
            filtered_entries = []
            for entry in time_entries:
                if employee_id and entry.employeeId != employee_id:
                    continue
                if start_date and entry.date < start_date:
                    continue
                if end_date and entry.date > end_date:
                    continue
                if project_id and project_id != "all" and entry.projectId != project_id:
                    continue
                filtered_entries.append(entry)
            time_entries = filtered_entries
        
        total = len(time_entries)
        
        transformed_entries = [transform_db_time_entry_to_pydantic(entry) for entry in time_entries]
        
        return HRMTimeEntriesResponse(
            timeEntries=transformed_entries,
            pagination={
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time entries: {str(e)}")

@router.post("/time-entries", response_model=TimeEntry)
async def create_project_time_entry(
    time_entry_data: TimeEntryCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_CREATE.value))
):
    try:
        if not tenant_context or not tenant_context.get("tenant_id"):
            raise HTTPException(status_code=400, detail="Tenant context required")
        from uuid import UUID
        tid = tenant_context["tenant_id"]
        data = time_entry_data.model_dump()
        emp_uuid = UUID(str(data["employeeId"]))
        tenant_uuid = UUID(str(tid))
        proj_uuid = UUID(str(data["projectId"])) if data.get("projectId") else None
        task_uuid = UUID(str(data["taskId"])) if data.get("taskId") else None
        date_str = str(data["date"])[:10]
        date_part = datetime.strptime(date_str, "%Y-%m-%d").date()
        cin = (data.get("clockIn") or "").strip()

        def parse_clock(s: str):
            if not s:
                return None
            if len(s) == 5 and s[2] == ":":
                return datetime.combine(date_part, datetime.strptime(s, "%H:%M").time())
            try:
                return datetime.fromisoformat(s.replace("Z", "+00:00"))
            except Exception:
                return None

        st = parse_clock(cin) or datetime.combine(date_part, datetime.min.time())
        et = parse_clock((data.get("clockOut") or "").strip())
        hrs = float(data["totalHours"]) if data.get("totalHours") is not None else 0.0
        if hrs <= 0 and et and st:
            hrs = max(0.0, (et - st).total_seconds() / 3600)
        if hrs <= 0:
            hrs = 1.0

        row_dict = {
            "id": uuid.uuid4(),
            "tenant_id": tenant_uuid,
            "employeeId": emp_uuid,
            "projectId": proj_uuid,
            "taskId": task_uuid,
            "date": date_part,
            "startTime": st,
            "endTime": et,
            "hours": hrs,
            "description": data.get("notes"),
        }
        db_entry = create_time_entry(row_dict, db)
        return transform_db_time_entry_to_pydantic(db_entry)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating time entry: {str(e)}")

@router.get("/time-entries/{entry_id}", response_model=TimeEntry)
async def get_project_time_entry(
    entry_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_VIEW.value))
):
    """Get a specific time entry by ID"""
    try:
        time_entry = get_time_entry_by_id(entry_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        return time_entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time entry: {str(e)}")

@router.put("/time-entries/{entry_id}", response_model=TimeEntry)
async def update_project_time_entry(
    entry_id: str,
    time_entry_data: TimeEntryUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_UPDATE.value))
):
    """Update a time entry"""
    try:
        time_entry = update_time_entry(db, entry_id, time_entry_data.dict(), tenant_context["tenant_id"] if tenant_context else None)
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        return time_entry
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating time entry: {str(e)}")

@router.delete("/time-entries/{entry_id}")
async def delete_project_time_entry(
    entry_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_DELETE.value))
):
    """Delete a time entry"""
    try:
        success = delete_time_entry(entry_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not success:
            raise HTTPException(status_code=404, detail="Time entry not found")
        return {"message": "Time entry deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting time entry: {str(e)}")

@router.post("/time-entries/{entry_id}/approve", response_model=TimeEntry)
async def approve_project_time_entry(
    entry_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_UPDATE.value))
):
    """Approve a time entry"""
    try:
        time_entry = get_time_entry_by_id(entry_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        time_entry.isApproved = True
        time_entry.approvedBy = str(current_user.id)
        time_entry.approvedAt = datetime.now()
        time_entry.status = "approved"
        
        db.commit()
        db.refresh(time_entry)
        
        return time_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error approving time entry: {str(e)}")

@router.post("/time-entries/{entry_id}/reject", response_model=TimeEntry)
async def reject_project_time_entry(
    entry_id: str,
    rejection_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_UPDATE.value))
):
    """Reject a time entry"""
    try:
        time_entry = get_time_entry_by_id(entry_id, db, tenant_context["tenant_id"] if tenant_context else None)
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        time_entry.isApproved = False
        time_entry.approvedBy = str(current_user.id)
        time_entry.approvedAt = datetime.now()
        time_entry.status = "rejected"
        time_entry.notes = f"{time_entry.notes or ''}\nRejection reason: {rejection_data.get('reason', 'No reason provided')}"
        
        db.commit()
        db.refresh(time_entry)
        
        return time_entry
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error rejecting time entry: {str(e)}")

@router.get("/time-tracking/dashboard")
async def get_project_time_tracking_dashboard(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_VIEW.value))
):
    """Get time tracking dashboard data"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get recent time entries
        recent_entries = get_time_entries(db, tenant_id, 0, 10)
        
        # Get current active session (if any)
        current_session = None
        
        # Get basic stats
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        # Calculate stats from time entries
        all_entries = get_time_entries(db, tenant_id, 0, 1000)
        
        today_hours = sum(entry.hours or 0 for entry in all_entries if entry.date == today)
        week_hours = sum(entry.hours or 0 for entry in all_entries if entry.date >= week_start)
        month_hours = sum(entry.hours or 0 for entry in all_entries if entry.date >= month_start)
        total_hours = sum(entry.hours or 0 for entry in all_entries)
        
        stats = {
            "todayHours": today_hours,
            "weekHours": week_hours,
            "monthHours": month_hours,
            "totalHours": total_hours,
            "averageDailyHours": total_hours / max(1, len(set(entry.date.isoformat() for entry in all_entries))),
            "overtimeHours": max(0, total_hours - (len(set(entry.date.isoformat() for entry in all_entries)) * 8))
        }
        
        return {
            "stats": stats,
            "recentEntries": recent_entries,
            "currentSession": current_session
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time tracking dashboard: {str(e)}")

@router.get("/time-tracking/stats")
async def get_project_time_tracking_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_VIEW.value))
):
    """Get time tracking statistics"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get time entries with filters
        all_entries = get_time_entries(db, tenant_id, 0, 1000)
        
        # Apply filters
        if employee_id:
            all_entries = [entry for entry in all_entries if str(entry.employeeId) == employee_id]
        if start_date:
            all_entries = [entry for entry in all_entries if entry.date.isoformat() >= start_date]
        if end_date:
            all_entries = [entry for entry in all_entries if entry.date.isoformat() <= end_date]
        
        # Calculate stats
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        
        today_hours = sum(entry.hours or 0 for entry in all_entries if entry.date == today)
        week_hours = sum(entry.hours or 0 for entry in all_entries if entry.date >= week_start)
        month_hours = sum(entry.hours or 0 for entry in all_entries if entry.date >= month_start)
        total_hours = sum(entry.hours or 0 for entry in all_entries)
        
        unique_days = len(set(entry.date.isoformat() for entry in all_entries))
        average_daily_hours = total_hours / max(1, unique_days)
        overtime_hours = max(0, total_hours - (unique_days * 8))
        
        return {
            "todayHours": today_hours,
            "weekHours": week_hours,
            "monthHours": month_hours,
            "totalHours": total_hours,
            "averageDailyHours": average_daily_hours,
            "overtimeHours": overtime_hours
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching time tracking stats: {str(e)}")

@router.get("/time-tracking/current-session")
async def get_current_project_time_session(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_VIEW.value))
):
    """Get current active time session"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get employee record for current user
        employee = db.query(DBEmployee).filter(
            DBEmployee.userId == str(current_user.id),
            DBEmployee.tenant_id == tenant_id
        ).first()
        
        if not employee:
            return {"session": None}
        
        # Find active time entry for current user (has startTime but no endTime)
        active_entry = db.query(DBTimeEntry).filter(
            DBTimeEntry.employeeId == str(employee.id),
            DBTimeEntry.tenant_id == tenant_id,
            DBTimeEntry.startTime.isnot(None),
            DBTimeEntry.endTime.is_(None)
        ).first()
        
        if active_entry:
            return {
                "session": {
                    "id": str(active_entry.id),
                    "employeeId": str(active_entry.employeeId),
                    "projectId": str(active_entry.projectId) if active_entry.projectId else None,
                    "taskId": str(active_entry.taskId) if active_entry.taskId else None,
                    "startTime": active_entry.startTime.isoformat() if active_entry.startTime else None,
                    "description": active_entry.description,
                    "isActive": True
                }
            }
        else:
            return {"session": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching current session: {str(e)}")

@router.post("/time-tracking/start")
async def start_project_time_session(
    session_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_CREATE.value))
):
    """Start a new time tracking session"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Check if user has an employee record, create one if not
        employee = db.query(DBEmployee).filter(
            DBEmployee.userId == str(current_user.id),
            DBEmployee.tenant_id == tenant_id
        ).first()
        
        if not employee:
            # Create employee record for the user
            employee = DBEmployee(
                id=uuid.uuid4(),
                tenant_id=tenant_id,
                userId=str(current_user.id),
                employeeId=f"EMP-{current_user.userName.upper()}",
                department="General",
                position=current_user.userRole,
                hireDate=datetime.now().date(),
                isActive=True,
                createdAt=datetime.now(),
                updatedAt=datetime.now()
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)
        
        # Check if user already has an active session
        existing_active = db.query(DBTimeEntry).filter(
            DBTimeEntry.employeeId == str(employee.id),
            DBTimeEntry.tenant_id == tenant_id,
            DBTimeEntry.startTime.isnot(None),
            DBTimeEntry.endTime.is_(None)
        ).first()
        
        if existing_active:
            raise HTTPException(status_code=400, detail="User already has an active time session")
        
        time_entry_data = {
            "employeeId": str(employee.id),
            "date": datetime.now().date(),
            "startTime": datetime.now(),
            "projectId": session_data.get("projectId"),
            "taskId": session_data.get("taskId"),
            "description": session_data.get("description"),
            "hours": 0.0,
            "tenant_id": tenant_id,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }
        
        time_entry = create_time_entry(time_entry_data, db)
        
        return {
            "session": {
                "id": str(time_entry.id),
                "employeeId": str(time_entry.employeeId),
                "projectId": str(time_entry.projectId) if time_entry.projectId else None,
                "taskId": str(time_entry.taskId) if time_entry.taskId else None,
                "startTime": time_entry.startTime.isoformat() if time_entry.startTime else None,
                "description": time_entry.description,
                "isActive": True
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting time session: {str(e)}")

@router.post("/time-tracking/stop/{session_id}")
async def stop_project_time_session(
    session_id: str,
    stop_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_UPDATE.value))
):
    """Stop a time tracking session"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get employee record for current user
        employee = db.query(DBEmployee).filter(
            DBEmployee.userId == str(current_user.id),
            DBEmployee.tenant_id == tenant_id
        ).first()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee record not found")
        
        time_entry = get_time_entry_by_id(session_id, db, tenant_id)
        
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        if time_entry.employeeId != employee.id:
            raise HTTPException(status_code=403, detail="Not authorized to stop this session")
        
        if time_entry.endTime is not None:
            raise HTTPException(status_code=400, detail="Session is not active")
        
        time_entry.endTime = datetime.now()
        
        if time_entry.startTime:
            duration = time_entry.endTime - time_entry.startTime
            time_entry.hours = duration.total_seconds() / 3600
        
        if stop_data.get("notes"):
            time_entry.description = f"{time_entry.description or ''}\n{stop_data['notes']}"
        
        time_entry.updatedAt = datetime.now()
        
        db.commit()
        db.refresh(time_entry)

        if time_entry.taskId:
            task = task_logic.get_task_by_id(str(time_entry.taskId), db, tenant_id)
            if task:
                sync_task_actual_hours(db, task)
                check_and_send_task_time_reminder(db, task)
        
        return {"timeEntry": transform_db_time_entry_to_pydantic(time_entry)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error stopping time session: {str(e)}")

@router.post("/time-tracking/pause/{session_id}")
async def pause_project_time_session(
    session_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_UPDATE.value))
):
    """Pause a time tracking session"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get employee record for current user
        employee = db.query(DBEmployee).filter(
            DBEmployee.userId == str(current_user.id),
            DBEmployee.tenant_id == tenant_id
        ).first()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee record not found")
        
        time_entry = get_time_entry_by_id(session_id, db, tenant_id)
        
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        if time_entry.employeeId != employee.id:
            raise HTTPException(status_code=403, detail="Not authorized to pause this session")
        
        if time_entry.endTime is not None:
            raise HTTPException(status_code=400, detail="Session is not active")
        
        time_entry.updatedAt = datetime.now()
        
        db.commit()
        db.refresh(time_entry)
        
        return {
            "session": {
                "id": str(time_entry.id),
                "employeeId": str(time_entry.employeeId),
                "projectId": str(time_entry.projectId) if time_entry.projectId else None,
                "taskId": str(time_entry.taskId) if time_entry.taskId else None,
                "startTime": time_entry.startTime.isoformat() if time_entry.startTime else None,
                "description": time_entry.description,
                "isActive": False
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error pausing time session: {str(e)}")

@router.post("/time-tracking/resume/{session_id}")
async def resume_project_time_session(
    session_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PROJECTS_UPDATE.value))
):
    """Resume a paused time tracking session"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        # Get employee record for current user
        employee = db.query(DBEmployee).filter(
            DBEmployee.userId == str(current_user.id),
            DBEmployee.tenant_id == tenant_id
        ).first()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee record not found")
        
        time_entry = get_time_entry_by_id(session_id, db, tenant_id)
        
        if not time_entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        if time_entry.employeeId != employee.id:
            raise HTTPException(status_code=403, detail="Not authorized to resume this session")
        
        if time_entry.endTime is not None:
            raise HTTPException(status_code=400, detail="Session is not paused")
        
        time_entry.updatedAt = datetime.now()
        
        db.commit()
        db.refresh(time_entry)
        
        return {
            "session": {
                "id": str(time_entry.id),
                "employeeId": str(time_entry.employeeId),
                "projectId": str(time_entry.projectId) if time_entry.projectId else None,
                "taskId": str(time_entry.taskId) if time_entry.taskId else None,
                "startTime": time_entry.startTime.isoformat() if time_entry.startTime else None,
                "description": time_entry.description,
                "isActive": True
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resuming time session: {str(e)}")

