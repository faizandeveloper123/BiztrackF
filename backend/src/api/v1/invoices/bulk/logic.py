from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import and_
from sqlalchemy.orm import Session

from .....config.database import User
from .....models.invoices import Invoice
from .....services.email_service import EmailService
from .....services.inventory_sync_service import InventorySyncService
from ..db_common import delete_invoice_dependencies
from ..items.schemas import InvoiceStatus
from .schemas import BulkOperationRequest, BulkOperationResponse


def bulk_send_invoices_endpoint(
    request: BulkOperationRequest,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        processed_count = 0
        failed_count = 0
        errors = []
        email_service = EmailService()
        invoices_to_send = []

        for invoice_id in request.invoiceIds:
            try:
                invoice = db.query(Invoice).filter(
                    and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
                ).first()

                if not invoice:
                    failed_count += 1
                    errors.append(f"Invoice {invoice_id} not found")
                    continue

                if invoice.status != InvoiceStatus.DRAFT:
                    failed_count += 1
                    errors.append(f"Invoice {invoice.invoiceNumber} is not in draft status")
                    continue

                invoices_to_send.append({
                    "customer_email": invoice.customerEmail,
                    "customer_name": invoice.customerName,
                    "invoice_number": invoice.invoiceNumber,
                    "total": invoice.total,
                    "currency": "USD",
                    "due_date": invoice.dueDate.strftime("%Y-%m-%d") if invoice.dueDate else None,
                    "pdf_path": None,
                })

            except Exception as e:
                failed_count += 1
                errors.append(f"Failed to prepare invoice {invoice_id}: {str(e)}")

        if invoices_to_send:
            email_results = email_service.send_bulk_invoice_emails(invoices_to_send)

            for invoice_id in request.invoiceIds:
                try:
                    invoice = db.query(Invoice).filter(
                        and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
                    ).first()

                    if invoice and invoice.status == InvoiceStatus.DRAFT:
                        invoice.status = InvoiceStatus.SENT
                        invoice.sentAt = datetime.utcnow()
                        invoice.updatedAt = datetime.utcnow()
                        processed_count += 1

                except Exception as e:
                    failed_count += 1
                    errors.append(f"Failed to update invoice {invoice_id}: {str(e)}")

            errors.extend(email_results["errors"])
            processed_count = email_results["sent"]
            failed_count += email_results["failed"]

        db.commit()

        return BulkOperationResponse(
            message=f"Bulk send completed. {processed_count} invoices sent successfully via email.",
            processed_count=processed_count,
            failed_count=failed_count,
            errors=errors,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to bulk send invoices: {str(e)}")


def bulk_mark_invoices_as_paid_endpoint(
    request: BulkOperationRequest,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        processed_count = 0
        failed_count = 0
        errors = []

        for invoice_id in request.invoiceIds:
            try:
                invoice = db.query(Invoice).filter(
                    and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
                ).first()

                if not invoice:
                    failed_count += 1
                    errors.append(f"Invoice {invoice_id} not found")
                    continue

                invoice.status = InvoiceStatus.PAID
                invoice.paidAt = datetime.utcnow()
                invoice.updatedAt = datetime.utcnow()
                processed_count += 1

                try:
                    sync_service = InventorySyncService(db)
                    sync_result = sync_service.sync_invoice_with_inventory(
                        invoice_id=invoice_id,
                        tenant_id=tenant_id,
                        user_id=str(current_user.id),
                    )
                    if not sync_result["success"]:
                        errors.append(
                            f"Inventory sync failed for invoice {invoice.invoiceNumber}: {sync_result.get('error', 'Unknown error')}"
                        )
                except Exception as sync_error:
                    errors.append(f"Inventory sync error for invoice {invoice.invoiceNumber}: {str(sync_error)}")

            except Exception as e:
                failed_count += 1
                errors.append(f"Failed to mark invoice {invoice_id} as paid: {str(e)}")

        db.commit()

        return BulkOperationResponse(
            message=f"Bulk mark as paid completed. {processed_count} invoices marked as paid.",
            processed_count=processed_count,
            failed_count=failed_count,
            errors=errors,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to bulk mark invoices as paid: {str(e)}")


def bulk_mark_invoices_as_unpaid_endpoint(
    request: BulkOperationRequest,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        processed_count = 0
        failed_count = 0
        errors = []

        for invoice_id in request.invoiceIds:
            try:
                invoice = db.query(Invoice).filter(
                    and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
                ).first()

                if not invoice:
                    failed_count += 1
                    errors.append(f"Invoice {invoice_id} not found")
                    continue

                invoice.status = InvoiceStatus.SENT
                invoice.paidAt = None
                invoice.updatedAt = datetime.utcnow()
                processed_count += 1

            except Exception as e:
                failed_count += 1
                errors.append(f"Failed to mark invoice {invoice_id} as unpaid: {str(e)}")

        db.commit()

        return BulkOperationResponse(
            message=f"Bulk mark as unpaid completed. {processed_count} invoices marked as unpaid.",
            processed_count=processed_count,
            failed_count=failed_count,
            errors=errors,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to bulk mark invoices as unpaid: {str(e)}")


def bulk_delete_invoices_endpoint(
    request: BulkOperationRequest,
    db: Session,
    current_user: User,
    tenant_context: dict,
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        processed_count = 0
        failed_count = 0
        errors = []

        for invoice_id in request.invoiceIds:
            try:
                invoice = db.query(Invoice).filter(
                    and_(Invoice.id == invoice_id, Invoice.tenant_id == tenant_id)
                ).first()

                if not invoice:
                    failed_count += 1
                    errors.append(f"Invoice {invoice_id} not found")
                    continue

                try:
                    sync_service = InventorySyncService(db)
                    sync_service.restore_invoice_stock(str(invoice_id), tenant_id)
                    delete_invoice_dependencies(db, str(invoice_id), tenant_id)
                except Exception as dep_error:
                    failed_count += 1
                    errors.append(
                        f"Could not delete related records for {invoice.invoiceNumber}: {str(dep_error)}"
                    )
                    continue

                db.delete(invoice)
                processed_count += 1

            except Exception as e:
                failed_count += 1
                errors.append(f"Failed to delete invoice {invoice_id}: {str(e)}")

        db.commit()

        return BulkOperationResponse(
            message=f"Bulk delete completed. {processed_count} invoices deleted successfully.",
            processed_count=processed_count,
            failed_count=failed_count,
            errors=errors,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to bulk delete invoices: {str(e)}")
