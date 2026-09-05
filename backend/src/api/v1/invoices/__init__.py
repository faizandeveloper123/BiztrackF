from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ....config.database import get_db, User
from ....api.dependencies import get_current_user, get_tenant_context, require_permission
from .bulk.api import router as bulk_router
from .dashboard.api import router as dashboard_router
from .actions.api import router as actions_router
from .payments.api import router as payments_router
from .items.api import router as items_router
from .items.schemas import InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoicesResponse
from .items import logic as items_logic
from .shared import generate_order_number

router = APIRouter(prefix="/invoices", tags=["Invoices"])
router.include_router(bulk_router)
router.include_router(dashboard_router)
router.include_router(actions_router)
router.include_router(payments_router)


@router.post("", response_model=InvoiceResponse)
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:create")),
):
    return items_logic.create_invoice_endpoint(invoice_data, db, current_user, tenant_context)


@router.get("/next-order-number")
def get_next_order_number(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:view")),
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    return {"orderNumber": generate_order_number(tenant_id, db)}


@router.get("", response_model=InvoicesResponse)
def get_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=500),
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    amount_from: Optional[float] = None,
    amount_to: Optional[float] = None,
    search: Optional[str] = None,
    order_prefix: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:view")),
):
    return items_logic.get_invoices_endpoint(
        db, current_user, tenant_context, page, limit,
        status, customer_id, date_from, date_to, amount_from, amount_to, search, order_prefix,
    )


router.include_router(items_router)
