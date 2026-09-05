import uuid
from datetime import date, datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from ....config.database import (
    get_employee_by_id,
    get_employee_by_user_id,
    get_user_by_id,
)
from ....config.core_models import project_team_members
from ....config.hrm_models import (
    Employee as DBEmployee,
    EmployeeDevice as DBEmployeeDevice,
    LeaveRequest as DBLeaveRequest,
    TimeEntry as DBTimeEntry,
)
from ....models.hrm_models import (
    Employee,
    EmployeeType,
    EmploymentStatus,
    LeaveRequest,
)
from ....models.platform.user import User
from ....models.projects import Project as DBProject, Task as DBTask
from ....services.rbac_service import RBACService

ANNUAL_LEAVE_ALLOWANCE = 20


def _format_date(value):
    if not value:
        return None
    if isinstance(value, str):
        return value
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def is_manager(db: Session, user: User, tenant_id: str) -> bool:
    if RBACService.is_owner(db, str(user.id), tenant_id):
        return True
    if user.userRole in ("admin", "super_admin", "project_manager"):
        return True
    return (
        RBACService.has_permission(db, str(user.id), tenant_id, "hrm:create")
        or RBACService.has_permission(db, str(user.id), tenant_id, "hrm:leave_requests:update")
        or RBACService.has_permission(db, str(user.id), tenant_id, "hrm:employees:update")
    )


def employee_display_name(db: Session, emp: Optional[DBEmployee]) -> str:
    if not emp or not emp.userId:
        return ""
    emp_user = get_user_by_id(str(emp.userId), db)
    if not emp_user:
        return ""
    name = f"{emp_user.firstName or ''} {emp_user.lastName or ''}".strip()
    return name or emp_user.userName or ""


def employee_to_model(db_employee: DBEmployee, db: Session) -> Employee:
    user = get_user_by_id(str(db_employee.userId), db) if db_employee.userId else None
    department = db_employee.department or "other"
    emp_type = db_employee.employeeType or "full_time"
    try:
        employee_type = EmployeeType(emp_type)
    except ValueError:
        employee_type = EmployeeType.FULL_TIME
    emp_status = db_employee.employmentStatus or "active"
    try:
        employment_status = EmploymentStatus(emp_status)
    except ValueError:
        employment_status = EmploymentStatus.ACTIVE
    return Employee(
        id=str(db_employee.id),
        firstName=user.firstName if user else "",
        lastName=user.lastName if user else "",
        email=user.email if user else "",
        phone=db_employee.phone,
        dateOfBirth=db_employee.dateOfBirth.isoformat() if db_employee.dateOfBirth else None,
        hireDate=db_employee.hireDate.isoformat() if db_employee.hireDate else "",
        employeeId=db_employee.employeeId or "",
        department=department,
        position=db_employee.position or "",
        employeeType=employee_type,
        employmentStatus=employment_status,
        managerId=str(db_employee.managerId) if db_employee.managerId else None,
        salary=db_employee.salary,
        address=db_employee.address,
        emergencyContact=db_employee.emergencyContact,
        emergencyPhone=db_employee.emergencyPhone,
        skills=db_employee.skills or [],
        certifications=db_employee.certifications or [],
        notes=db_employee.notes,
        resume_url=db_employee.resume_url,
        attachments=db_employee.attachments or [],
        avatar=user.avatar if user else None,
        tenant_id=str(db_employee.tenant_id),
        createdBy=str(db_employee.userId) if db_employee.userId else "",
        createdAt=db_employee.createdAt.isoformat() if db_employee.createdAt else "",
        updatedAt=db_employee.updatedAt.isoformat() if db_employee.updatedAt else "",
    )


def get_or_create_employee(db: Session, user: User, tenant_id: str) -> DBEmployee:
    employee = get_employee_by_user_id(str(user.id), db, tenant_id)
    if employee:
        return employee
    employee = DBEmployee(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        userId=str(user.id),
        employeeId=f"EMP-{user.userName.upper()[:12]}",
        department="general",
        position=user.userRole or "team_member",
        hireDate=datetime.utcnow().date(),
        employmentStatus="active",
        employeeType="full_time",
        isActive=True,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


def device_to_dict(d: DBEmployeeDevice, db: Session) -> dict:
    emp = get_employee_by_id(str(d.employeeId), db, str(d.tenant_id))
    return {
        "id": str(d.id),
        "employeeId": str(d.employeeId),
        "employeeName": employee_display_name(db, emp),
        "name": d.name,
        "deviceType": d.deviceType or "other",
        "serialNumber": d.serialNumber,
        "model": d.model,
        "status": d.status or "assigned",
        "assignedAt": d.assignedAt.isoformat() if d.assignedAt else None,
        "returnedAt": d.returnedAt.isoformat() if d.returnedAt else None,
        "notes": d.notes,
        "tenant_id": str(d.tenant_id),
    }


def leave_balance(db: Session, employee_id: str, tenant_id: str) -> float:
    year_start = date(datetime.utcnow().year, 1, 1)
    used = (
        db.query(DBLeaveRequest)
        .filter(
            DBLeaveRequest.tenant_id == tenant_id,
            DBLeaveRequest.employeeId == employee_id,
            DBLeaveRequest.leaveType == "annual",
            DBLeaveRequest.status == "approved",
            DBLeaveRequest.startDate >= year_start,
        )
        .all()
    )
    total_used = sum(r.days or 0 for r in used)
    return max(0.0, float(ANNUAL_LEAVE_ALLOWANCE - total_used))


def hours_today(db: Session, employee_id: str, tenant_id: str) -> float:
    today = datetime.utcnow().date()
    entries = (
        db.query(DBTimeEntry)
        .filter(
            DBTimeEntry.tenant_id == tenant_id,
            DBTimeEntry.employeeId == employee_id,
            DBTimeEntry.date == today,
        )
        .all()
    )
    total = 0.0
    for e in entries:
        if e.endTime and e.startTime:
            total += (e.endTime - e.startTime).total_seconds() / 3600
        elif e.hours:
            total += e.hours or 0
    active = next((e for e in entries if e.startTime and not e.endTime), None)
    if active and active.startTime:
        total += (datetime.utcnow() - active.startTime).total_seconds() / 3600
    return round(total, 2)


def active_session(db: Session, employee_id: str, tenant_id: str) -> Optional[dict]:
    entry = (
        db.query(DBTimeEntry)
        .filter(
            DBTimeEntry.tenant_id == tenant_id,
            DBTimeEntry.employeeId == employee_id,
            DBTimeEntry.startTime.isnot(None),
            DBTimeEntry.endTime.is_(None),
        )
        .first()
    )
    if not entry:
        return None
    return {
        "id": str(entry.id),
        "employeeId": str(entry.employeeId),
        "projectId": str(entry.projectId) if entry.projectId else None,
        "taskId": str(entry.taskId) if entry.taskId else None,
        "startTime": entry.startTime.isoformat() if entry.startTime else None,
        "description": entry.description,
        "isActive": True,
    }


def user_tasks(db: Session, user_id: str, tenant_id: str, limit: int = 20) -> List[dict]:
    tasks = (
        db.query(DBTask)
        .filter(
            DBTask.tenant_id == tenant_id,
            DBTask.assignedToId == user_id,
            DBTask.status != "completed",
            DBTask.status != "cancelled",
        )
        .order_by(DBTask.dueDate.asc().nullslast(), DBTask.createdAt.desc())
        .limit(limit)
        .all()
    )
    result = []
    for t in tasks:
        result.append({
            "id": str(t.id),
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "dueDate": _format_date(t.dueDate),
            "projectId": str(t.projectId) if t.projectId else None,
            "actualHours": t.actualHours or 0,
        })
    return result


def default_project_id(db: Session, user_id: str, tenant_id: str) -> Optional[str]:
    row = (
        db.query(DBProject)
        .join(project_team_members, DBProject.id == project_team_members.c.project_id)
        .filter(
            project_team_members.c.user_id == user_id,
            DBProject.tenant_id == tenant_id,
        )
        .first()
    )
    if row:
        return str(row.id)
    pm = (
        db.query(DBProject)
        .filter(DBProject.tenant_id == tenant_id, DBProject.projectManagerId == user_id)
        .first()
    )
    return str(pm.id) if pm else None


def leave_to_model(r: DBLeaveRequest) -> LeaveRequest:
    return LeaveRequest(
        id=str(r.id),
        tenant_id=str(r.tenant_id),
        employeeId=str(r.employeeId),
        leaveType=r.leaveType,
        startDate=r.startDate.isoformat() if r.startDate else "",
        endDate=r.endDate.isoformat() if r.endDate else "",
        totalDays=float(r.days or 0),
        reason=r.reason or "",
        status=r.status or "pending",
        approvedBy=str(r.approvedBy) if r.approvedBy else None,
        approvedAt=r.approvedAt.isoformat() if r.approvedAt else None,
        rejectionReason=r.rejectionReason,
        notes=r.comments,
        createdBy="",
        createdAt=r.createdAt.isoformat() if r.createdAt else "",
        updatedAt=r.updatedAt.isoformat() if r.updatedAt else "",
    )
