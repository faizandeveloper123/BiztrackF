from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from .....config.database import get_employee_by_id
from .....config.hrm_models import Employee as DBEmployee, EmployeeDevice as DBEmployeeDevice, LeaveRequest as DBLeaveRequest
from .....models.platform.user import User
from ...http_common import tenant_id_str
from ..shared import (
    active_session,
    employee_display_name,
    employee_to_model,
    get_or_create_employee,
    hours_today,
    is_manager,
    leave_balance,
    user_tasks,
)


def get_dashboard(db: Session, current_user: User, tenant_context: dict) -> dict[str, Any]:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    manager = is_manager(db, current_user, tenant_id)
    today = datetime.utcnow().date()
    tasks = user_tasks(db, str(current_user.id), tenant_id, 5)
    due_today = sum(
        1
        for t in tasks
        if t.get("dueDate") and str(t["dueDate"])[:10] == today.isoformat()
    )
    devices_count = (
        db.query(DBEmployeeDevice)
        .filter(
            DBEmployeeDevice.tenant_id == tenant_id,
            DBEmployeeDevice.employeeId == str(employee.id),
            DBEmployeeDevice.status == "assigned",
        )
        .count()
    )
    pending_leave = (
        db.query(DBLeaveRequest)
        .filter(
            DBLeaveRequest.tenant_id == tenant_id,
            DBLeaveRequest.employeeId == str(employee.id),
            DBLeaveRequest.status == "pending",
        )
        .count()
    )
    payload: dict[str, Any] = {
        "employee": employee_to_model(employee, db),
        "isManager": manager,
        "stats": {
            "tasksDueToday": due_today,
            "openTasks": len(tasks),
            "hoursToday": hours_today(db, str(employee.id), tenant_id),
            "leaveBalance": leave_balance(db, str(employee.id), tenant_id),
            "devicesCount": devices_count,
            "pendingLeave": pending_leave,
        },
        "activeSession": active_session(db, str(employee.id), tenant_id),
        "todayTasks": tasks,
    }
    if manager:
        pending = (
            db.query(DBLeaveRequest)
            .filter(
                DBLeaveRequest.tenant_id == tenant_id,
                DBLeaveRequest.status == "pending",
            )
            .order_by(DBLeaveRequest.createdAt.desc())
            .limit(10)
            .all()
        )
        approvals = []
        for r in pending:
            emp = get_employee_by_id(str(r.employeeId), db, tenant_id)
            approvals.append({
                "id": str(r.id),
                "employeeName": employee_display_name(db, emp),
                "leaveType": r.leaveType,
                "startDate": r.startDate.isoformat() if r.startDate else "",
                "endDate": r.endDate.isoformat() if r.endDate else "",
                "totalDays": r.days,
                "reason": r.reason,
                "status": r.status,
            })
        payload["pendingApprovals"] = approvals
        team_rows = []
        employees = db.query(DBEmployee).filter(DBEmployee.tenant_id == tenant_id, DBEmployee.isActive == True).all()
        for emp in employees[:50]:
            team_rows.append({
                "employeeId": str(emp.id),
                "name": employee_display_name(db, emp),
                "hoursToday": hours_today(db, str(emp.id), tenant_id),
            })
        payload["teamTimeToday"] = team_rows
    return payload
