from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db, User
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .schemas import SendInvoiceRequest
from . import logic

router = APIRouter()


@router.post("/test-email")
def test_email_configuration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:view")),
):
    return logic.test_email_configuration_endpoint(db, current_user, tenant_context)


@router.post("/{invoice_id}/send")
def send_invoice(
    invoice_id: str,
    request: Optional[SendInvoiceRequest] = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:update")),
):
    return logic.send_invoice_endpoint(invoice_id, request, db, current_user, tenant_context)


@router.post("/{invoice_id}/send-whatsapp")
def send_invoice_whatsapp(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:update")),
):
    return logic.send_invoice_whatsapp_endpoint(invoice_id, db, current_user, tenant_context)


@router.post("/{invoice_id}/mark-as-paid")
def mark_invoice_as_paid(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:update")),
):
    return logic.mark_invoice_as_paid_endpoint(invoice_id, db, current_user, tenant_context)


@router.get("/{invoice_id}/download")
def download_invoice_pdf(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission("sales:invoices:view")),
):
    return logic.download_invoice_pdf_endpoint(invoice_id, db, current_user, tenant_context)
