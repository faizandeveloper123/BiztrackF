from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .....api.dependencies import get_current_user, get_tenant_context
from .....config.database import get_db
from .....models.hrm_models import LeaveRequest
from .....models.platform.user import User
from . import logic
from .schemas import LeaveApprovalBody, LeaveRequestSelfCreate

router = APIRouter()


@router.get("/leave-requests")
async def my_leave_requests(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.list_leave_requests(db, current_user, tenant_context, status, page, limit)


@router.post("/leave-requests", response_model=LeaveRequest)
async def create_my_leave_request(
    body: LeaveRequestSelfCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.create_my_leave_request(body, db, current_user, tenant_context)


@router.post("/leave-requests/{request_id}/review", response_model=LeaveRequest)
async def review_leave_request(
    request_id: str,
    body: LeaveApprovalBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
):
    return logic.review_leave_request(request_id, body, db, current_user, tenant_context)
