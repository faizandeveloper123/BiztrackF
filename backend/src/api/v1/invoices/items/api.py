from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db, User
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .schemas import InvoiceUpdate, InvoiceResponse
from . import logic

router = APIRouter()


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:view")),
):
    return logic.get_invoice_endpoint(invoice_id, db, current_user, tenant_context)


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: str,
    invoice_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:update")),
):
    return logic.update_invoice_endpoint(invoice_id, invoice_data, db, current_user, tenant_context)


@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:delete")),
):
    return logic.delete_invoice_endpoint(invoice_id, db, current_user, tenant_context)
