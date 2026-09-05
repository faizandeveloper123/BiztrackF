from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .schemas import POSShiftCreate, POSShiftUpdate, POSShiftsResponse, POSShiftResponse
from . import logic

router = APIRouter()


@router.get("/shifts", response_model=POSShiftsResponse)
async def list_pos_shifts(
    status: Optional[str] = Query(None),
    cashier_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:shifts:view")),
):
    return logic.list_pos_shifts_endpoint(
        db, tenant_context, status, cashier_id, date_from, date_to, page, limit
    )


@router.get("/shifts/current/open")
async def get_current_open_shift(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:shifts:view")),
):
    return logic.get_current_open_shift_endpoint(db, tenant_context, current_user)


@router.get("/shifts/{shift_id}", response_model=POSShiftResponse)
async def get_pos_shift(
    shift_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:shifts:view")),
):
    return logic.get_pos_shift_endpoint(db, tenant_context, shift_id)


@router.post("/shifts", response_model=POSShiftResponse)
async def open_pos_shift(
    shift_data: POSShiftCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:shifts:create")),
):
    return logic.open_pos_shift_endpoint(db, tenant_context, current_user, shift_data)


@router.put("/shifts/{shift_id}", response_model=POSShiftResponse)
async def update_pos_shift(
    shift_id: str,
    shift_data: POSShiftUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:shifts:update")),
):
    return logic.update_pos_shift_endpoint(db, tenant_context, shift_id, shift_data)
