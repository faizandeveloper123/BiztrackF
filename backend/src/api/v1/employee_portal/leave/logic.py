import uuid
from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....config.database import (
    create_leave_request,
    get_leave_request_by_id,
    update_leave_request,
)
from .....config.hrm_models import LeaveRequest as DBLeaveRequest
from .....models.hrm_models import LeaveRequest
from .....models.platform.user import User
from ...http_common import tenant_id_str
from ..shared import get_or_create_employee, is_manager, leave_to_model
from .schemas import LeaveApprovalBody, LeaveRequestSelfCreate


def list_leave_requests(
    db: Session,
    current_user: User,
    tenant_context: dict,
    status: Optional[str],
    page: int,
    limit: int,
) -> dict:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    manager = is_manager(db, current_user, tenant_id)
    q = db.query(DBLeaveRequest).filter(DBLeaveRequest.tenant_id == tenant_id)
    if not manager:
        q = q.filter(DBLeaveRequest.employeeId == str(employee.id))
    if status:
        q = q.filter(DBLeaveRequest.status == status)
    rows = q.order_by(DBLeaveRequest.createdAt.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "leaveRequests": [leave_to_model(r) for r in rows],
        "pagination": {"page": page, "limit": limit, "total": len(rows)},
    }


def create_my_leave_request(
    body: LeaveRequestSelfCreate,
    db: Session,
    current_user: User,
    tenant_context: dict,
) -> LeaveRequest:
    tenant_id = tenant_id_str(tenant_context)
    employee = get_or_create_employee(db, current_user, tenant_id)
    db_data = {
        "id": str(uuid.uuid4()),
        "tenant_id": tenant_id,
        "employeeId": str(employee.id),
        "leaveType": body.leaveType,
        "startDate": datetime.fromisoformat(body.startDate[:10]).date(),
        "endDate": datetime.fromisoformat(body.endDate[:10]).date(),
        "days": int(body.totalDays),
        "reason": body.reason,
        "status": "pending",
        "createdBy": str(current_user.id),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }
    created = create_leave_request(db_data, db)
    return leave_to_model(created)


def review_leave_request(
    request_id: str,
    body: LeaveApprovalBody,
    db: Session,
    current_user: User,
    tenant_context: dict,
) -> LeaveRequest:
    tenant_id = tenant_id_str(tenant_context)
    if not is_manager(db, current_user, tenant_id):
        raise HTTPException(status_code=403, detail="Manager access required")
    req = get_leave_request_by_id(request_id, db, tenant_id)
    if not req:
        raise HTTPException(status_code=404, detail="Leave request not found")
    manager_emp = get_or_create_employee(db, current_user, tenant_id)
    action = body.action.lower()
    if action == "approve":
        update_data = {
            "status": "approved",
            "approvedBy": str(manager_emp.id),
            "approvedAt": datetime.utcnow(),
        }
    elif action == "reject":
        update_data = {
            "status": "rejected",
            "rejectionReason": body.rejectionReason or "Rejected",
            "comments": body.rejectionReason or "Rejected",
        }
    else:
        raise HTTPException(status_code=400, detail="action must be approve or reject")
    updated = update_leave_request(request_id, update_data, db, tenant_id)
    return leave_to_model(updated)
