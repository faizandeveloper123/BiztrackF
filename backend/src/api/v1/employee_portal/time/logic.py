from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....config.database import create_time_entry, get_time_entry_by_id
from .....config.hrm_models import TimeEntry as DBTimeEntry
from .....models.platform.user import User
from ...projects.time_tracking.api import transform_db_time_entry_to_pydantic
from ...http_common import tenant_id_str
from ..shared import active_session, get_or_create_employee, is_manager
from .schemas import TimeSessionStart, TimeSessionStop


def list_time_entries(
    db: Session,
    current_user,
    tenant_context: dict,
    start_date: Optional[str],
    end_date: Optional[str],
    page: int,
    limit: int,
    employee_id: Optional[str],
) -> dict:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    manager = is_manager(db, current_user, tenant_id)
    target_id = employee_id if manager and employee_id else str(employee.id)
    if employee_id and not manager:
        raise HTTPException(status_code=403, detail="Not authorized")
    q = db.query(DBTimeEntry).filter(
        DBTimeEntry.tenant_id == tenant_id,
        DBTimeEntry.employeeId == target_id,
    )
    if start_date:
        q = q.filter(DBTimeEntry.date >= datetime.fromisoformat(start_date[:10]).date())
    if end_date:
        q = q.filter(DBTimeEntry.date <= datetime.fromisoformat(end_date[:10]).date())
    rows = q.order_by(DBTimeEntry.date.desc(), DBTimeEntry.startTime.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "timeEntries": [transform_db_time_entry_to_pydantic(r) for r in rows],
        "pagination": {"page": page, "limit": limit, "total": len(rows)},
    }


def get_current_session(db: Session, current_user: User, tenant_context: dict) -> dict:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    session = active_session(db, str(employee.id), tenant_id)
    return {"session": session}


def start_time_session(
    body: TimeSessionStart,
    db: Session,
    current_user: User,
    tenant_context: dict,
) -> dict:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    existing = active_session(db, str(employee.id), tenant_id)
    if existing:
        raise HTTPException(status_code=400, detail="Already clocked in")
    time_entry_data = {
        "employeeId": str(employee.id),
        "date": datetime.utcnow().date(),
        "startTime": datetime.utcnow(),
        "projectId": body.projectId,
        "taskId": body.taskId,
        "description": body.description,
        "hours": 0.0,
        "tenant_id": tenant_id,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    entry = create_time_entry(time_entry_data, db)
    return {
        "session": {
            "id": str(entry.id),
            "employeeId": str(entry.employeeId),
            "projectId": str(entry.projectId) if entry.projectId else None,
            "taskId": str(entry.taskId) if entry.taskId else None,
            "startTime": entry.startTime.isoformat() if entry.startTime else None,
            "description": entry.description,
            "isActive": True,
        }
    }


def stop_time_session(
    session_id: str,
    body: TimeSessionStop,
    db: Session,
    current_user: User,
    tenant_context: dict,
) -> dict:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    entry = get_time_entry_by_id(session_id, db, tenant_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Session not found")
    if str(entry.employeeId) != str(employee.id):
        raise HTTPException(status_code=403, detail="Not authorized")
    if entry.endTime is not None:
        raise HTTPException(status_code=400, detail="Session already stopped")
    entry.endTime = datetime.utcnow()
    if entry.startTime:
        entry.hours = (entry.endTime - entry.startTime).total_seconds() / 3600
    if body.notes:
        entry.description = f"{entry.description or ''}\n{body.notes}".strip()
    entry.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return {"timeEntry": transform_db_time_entry_to_pydantic(entry)}
