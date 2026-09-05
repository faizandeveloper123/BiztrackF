from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from . import logic

router = APIRouter()


@router.get("/reports/sales")
async def get_pos_sales_report(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    payment_method: Optional[str] = Query(None),
    cashier_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:reports:view")),
):
    return logic.get_pos_sales_report_endpoint(
        db, tenant_context, date_from, date_to, payment_method, cashier_id
    )


@router.get("/reports/inventory")
async def get_pos_inventory_report(
    low_stock_only: bool = Query(False, description="Show only low stock items"),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:reports:view")),
):
    return logic.get_pos_inventory_report_endpoint(db, tenant_context, low_stock_only, category)


@router.get("/reports/shifts")
async def get_pos_shifts_report(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    cashier_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:reports:view")),
):
    return logic.get_pos_shifts_report_endpoint(db, tenant_context, date_from, date_to, cashier_id)
