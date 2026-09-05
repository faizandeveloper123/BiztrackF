import logging
import urllib.parse
from datetime import datetime
from typing import Optional

from fastapi import HTTPException, Response
from sqlalchemy import and_
from sqlalchemy.orm import Session

from .....config.database import User
from .....models.invoices import Invoice
from .....services.email_service import EmailService
from .....services.inventory_sync_service import InventorySyncService
from ..items.schemas import InvoiceStatus
from .schemas import SendInvoiceRequest

logger = logging.getLogger(__name__)


def test_email_configuration_endpoint(db: Session, current_user: User, tenant_context: dict):
    try:
        email_service = EmailService()
        is_configured = email_service.test_email_connection()

        if is_configured:
            return {
                "message": "Email configuration is working correctly",
                "status": "success",
                "smtp_server": email_service.smtp_server,
                "smtp_port": email_service.smtp_port,
                "from_email": email_service.from_email,
            }
        return {
            "message": "Email configuration is not working. Please check your SMTP settings.",
            "status": "error",
            "smtp_server": email_service.smtp_server,
            "smtp_port": email_service.smtp_port,
            "from_email": email_service.from_email,
            "note": "Set SMTP_USERNAME, SMTP_PASSWORD, and FROM_EMAIL environment variables",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to test email configuration: {str(e)}")


def send_invoice_endpoint(
    invoice_id: str,
    request: Optional[SendInvoiceRequest],
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        invoice = db.query(Invoice).filter(
            and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
        ).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        to_email = None
        if request and request.to_email:
            to_email = request.to_email
        elif invoice.customerEmail:
            to_email = invoice.customerEmail
        else:
            raise HTTPException(status_code=400, detail="Email address is required to send invoice")

        pdf_bytes = None
        try:
            from ...pdf_generator_modern import generate_modern_invoice_pdf

            pdf_bytes = generate_modern_invoice_pdf(invoice, db)
        except Exception as pdf_error:
            logger.warning(f"Could not generate PDF for email: {str(pdf_error)}")

        email_service = EmailService()
        custom_message = request.message if request and request.message else None
        email_sent = email_service.send_invoice_email(
            to_email=to_email,
            customer_name=invoice.customerName,
            invoice_number=invoice.invoiceNumber,
            invoice_total=invoice.total,
            currency="USD",
            due_date=invoice.dueDate.strftime("%Y-%m-%d") if invoice.dueDate else None,
            invoice_pdf_bytes=pdf_bytes,
            custom_message=custom_message,
        )

        if invoice.status == InvoiceStatus.DRAFT:
            invoice.status = InvoiceStatus.SENT
        invoice.sentAt = datetime.utcnow()
        invoice.updatedAt = datetime.utcnow()

        try:
            from .....config.ledger_models import AccountReceivable, AccountReceivableStatus
            from datetime import datetime as dt

            existing_ar = db.query(AccountReceivable).filter(
                and_(
                    AccountReceivable.tenant_id == tenant_id,
                    AccountReceivable.invoice_id == str(invoice.id),
                )
            ).first()

            if not existing_ar:
                days_overdue = 0
                if invoice.dueDate < dt.utcnow():
                    days_overdue = (dt.utcnow() - invoice.dueDate).days

                ar = AccountReceivable(
                    tenant_id=tenant_id,
                    invoice_id=str(invoice.id),
                    invoice_number=invoice.invoiceNumber,
                    customer_id=invoice.customerId or "",
                    customer_name=invoice.customerName,
                    customer_email=invoice.customerEmail or "",
                    customer_phone=invoice.customerPhone,
                    invoice_date=invoice.issueDate,
                    due_date=invoice.dueDate,
                    invoice_amount=invoice.total,
                    amount_paid=0.0,
                    outstanding_balance=invoice.total,
                    currency="USD",
                    status=AccountReceivableStatus.PENDING if days_overdue == 0 else AccountReceivableStatus.OVERDUE,
                    payment_terms=None,
                    notes=None,
                    days_overdue=days_overdue,
                    created_by=current_user.id,
                )
                db.add(ar)
        except Exception as ar_error:
            logger.warning(f"Could not create Account Receivable: {str(ar_error)}")

        db.commit()

        if email_sent:
            return {"message": "Invoice sent successfully via email"}
        return {
            "message": "Invoice status updated but email could not be sent. Please check SMTP configuration in your environment variables.",
            "warning": "SMTP credentials not configured",
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to send invoice: {str(e)}")


def send_invoice_whatsapp_endpoint(
    invoice_id: str,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        invoice = db.query(Invoice).filter(
            and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
        ).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        from .....services.invoice_share import (
            create_or_get_invoice_share_code,
            public_invoice_short_url,
        )

        share_code = create_or_get_invoice_share_code(db, str(invoice.id), str(tenant_id))
        pdf_url = public_invoice_short_url(share_code)

        message = (
            f"Hi! Here is your invoice {invoice.invoiceNumber} "
            f"for {invoice.customerName}. "
            f"Amount: USD {invoice.total:.2f}. "
            f"View/download PDF: {pdf_url}"
        )

        whatsapp_url = f"https://api.whatsapp.com/send/?text={urllib.parse.quote(message)}"

        return {
            "whatsapp_url": whatsapp_url,
            "formatted_message": message,
            "pdf_url": pdf_url,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate WhatsApp link: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate WhatsApp link: {str(e)}")


def mark_invoice_as_paid_endpoint(
    invoice_id: str,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        invoice = db.query(Invoice).filter(
            and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
        ).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        invoice.status = InvoiceStatus.PAID
        invoice.paidAt = datetime.utcnow()
        invoice.updatedAt = datetime.utcnow()

        try:
            from .....config.ledger_models import AccountReceivable, AccountReceivableStatus

            existing_ar = db.query(AccountReceivable).filter(
                and_(
                    AccountReceivable.tenant_id == tenant_id,
                    AccountReceivable.invoice_id == str(invoice.id),
                )
            ).first()

            if existing_ar:
                existing_ar.amount_paid = invoice.total
                existing_ar.outstanding_balance = 0
                existing_ar.status = AccountReceivableStatus.PAID
                existing_ar.days_overdue = 0
                existing_ar.updated_at = datetime.utcnow()
        except Exception as ar_error:
            print(f"Warning: Could not update Account Receivable: {str(ar_error)}")

        db.commit()

        try:
            sync_service = InventorySyncService(db)
            sync_result = sync_service.sync_invoice_with_inventory(
                invoice_id=invoice_id,
                tenant_id=tenant_id,
                user_id=str(current_user.id),
            )

            if sync_result["success"]:
                return {
                    "message": "Invoice marked as paid and inventory synced successfully",
                    "inventory_sync": {
                        "success": True,
                        "total_items_deducted": sync_result["total_items_deducted"],
                        "items_processed": sync_result["items_processed"],
                    },
                }
            print(f"Warning: Inventory sync failed for invoice {invoice_id}: {sync_result.get('error', 'Unknown error')}")
            return {
                "message": "Invoice marked as paid, but inventory sync failed",
                "inventory_sync": {
                    "success": False,
                    "error": sync_result.get("error", "Unknown error"),
                    "errors": sync_result.get("errors", []),
                },
            }

        except Exception as sync_error:
            print(f"Warning: Inventory sync error for invoice {invoice_id}: {str(sync_error)}")
            return {
                "message": "Invoice marked as paid, but inventory sync encountered an error",
                "inventory_sync": {"success": False, "error": str(sync_error)},
            }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to mark invoice as paid: {str(e)}")


def download_invoice_pdf_endpoint(
    invoice_id: str,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    try:
        if not tenant_context:
            raise HTTPException(
                status_code=400,
                detail="Tenant context required. Please include X-Tenant-ID header.",
            )

        tenant_id = tenant_context["tenant_id"]
        invoice = db.query(Invoice).filter(
            and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
        ).first()

        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        from ...pdf_generator_modern import generate_modern_invoice_pdf

        pdf_content = generate_modern_invoice_pdf(invoice, db)

        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice-{invoice.invoiceNumber}.pdf"
            },
        )

    except HTTPException:
        raise
    except ValueError as e:
        if "customization is required" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Invoice customization is required. Please customize your invoice template first using the 'Customize Invoice' button.",
            )
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice download: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate invoice download: {str(e)}")
