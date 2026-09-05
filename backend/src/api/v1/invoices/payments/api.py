from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db, User
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .schemas import PaymentCreate, PaymentResponse, PaymentsResponse
from . import logic

router = APIRouter()


@router.get("/payments/", response_model=PaymentsResponse)
def get_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    invoice_id: Optional[str] = None,
    payment_method: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:view")),
):
    return logic.get_payments_endpoint(
        db, current_user, tenant_context, page, limit,
        invoice_id, payment_method, status, date_from, date_to, search,
    )


@router.post("/{invoice_id}/payments", response_model=PaymentResponse)
def create_payment(
    invoice_id: str,
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:update")),
):
    return logic.create_payment_endpoint(invoice_id, payment_data, db, current_user, tenant_context)


@router.get("/{invoice_id}/payments", response_model=PaymentsResponse)
def get_invoice_payments(
    invoice_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:view")),
):
    return logic.get_invoice_payments_endpoint(
        invoice_id, db, current_user, tenant_context, page, limit
    )
