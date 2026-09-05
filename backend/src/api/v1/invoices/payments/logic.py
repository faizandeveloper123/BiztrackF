import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy import and_, or_, desc
from sqlalchemy.orm import Session

from .....config.database import User
from .....models.invoices import Invoice, Payment
from .....services.inventory_sync_service import InventorySyncService
from ..items.schemas import InvoiceStatus
from .schemas import PaymentCreate, PaymentResponse, PaymentsResponse, PaymentStatus


def get_payment_by_id(payment_id: str, db: Session, tenant_id: str = None) -> Optional[Payment]:
    query = db.query(Payment).filter(Payment.id == payment_id)
    if tenant_id:
        query = query.filter(Payment.tenant_id == tenant_id)
    return query.first()


def get_all_payments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payment]:
    query = db.query(Payment)
    if tenant_id:
        query = query.filter(Payment.tenant_id == tenant_id)
    return query.order_by(Payment.createdAt.desc()).offset(skip).limit(limit).all()


def get_payments_by_invoice(invoice_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payment]:
    query = db.query(Payment).filter(Payment.invoiceId == invoice_id)
    if tenant_id:
        query = query.filter(Payment.tenant_id == tenant_id)
    return query.order_by(Payment.paymentDate.desc()).offset(skip).limit(limit).all()


def get_payments_by_status(status: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payment]:
    query = db.query(Payment).filter(Payment.status == status)
    if tenant_id:
        query = query.filter(Payment.tenant_id == tenant_id)
    return query.order_by(Payment.createdAt.desc()).offset(skip).limit(limit).all()


def create_payment(payment_data: dict, db: Session) -> Payment:
    db_payment = Payment(**payment_data)
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment


def update_payment(payment_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Payment]:
    payment = get_payment_by_id(payment_id, db, tenant_id)
    if payment:
        for key, value in update_data.items():
            if hasattr(payment, key) and value is not None:
                setattr(payment, key, value)
        payment.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(payment)
    return payment


def delete_payment(payment_id: str, db: Session, tenant_id: str = None) -> bool:
    payment = get_payment_by_id(payment_id, db, tenant_id)
    if payment:
        db.delete(payment)
        db.commit()
        return True
    return False


def get_payments(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Payment]:
    return get_all_payments(db, tenant_id, skip, limit)


def create_payment_endpoint(
    invoice_id: str,
    payment_data: PaymentCreate,
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

        raw_pd = payment_data.paymentDate
        if raw_pd:
            payment_dt = datetime.fromisoformat(str(raw_pd).replace("Z", "+00:00"))
        else:
            payment_dt = datetime.utcnow()

        db_payment = Payment(
            id=str(uuid.uuid4()),
            tenant_id=tenant_id,
            invoiceId=invoice_id,
            amount=payment_data.amount,
            paymentMethod=payment_data.paymentMethod.value,
            paymentDate=payment_dt,
            reference=payment_data.reference,
            notes=payment_data.notes,
            status=PaymentStatus.COMPLETED.value,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow(),
        )

        db.add(db_payment)
        invoice.totalPaid += payment_data.amount
        invoice.balance = invoice.total - invoice.totalPaid

        invoice_was_paid = False
        if invoice.balance <= 0:
            invoice.status = InvoiceStatus.PAID
            invoice.paidAt = datetime.utcnow()
            invoice_was_paid = True
        elif invoice.balance < invoice.total:
            invoice.status = InvoiceStatus.PARTIALLY_PAID

        invoice.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(db_payment)

        try:
            from .....services.crm_sync_service import sync_on_payment
            sync_on_payment(db, db_payment, invoice, str(current_user.id))
            db.commit()
        except Exception:
            pass

        inventory_sync_result = None
        if invoice_was_paid:
            try:
                sync_service = InventorySyncService(db)
                sync_result = sync_service.sync_invoice_with_inventory(
                    invoice_id=invoice_id,
                    tenant_id=tenant_id,
                    user_id=str(current_user.id),
                )
                inventory_sync_result = sync_result
                if not sync_result["success"]:
                    print(f"Warning: Inventory sync failed for invoice {invoice_id}: {sync_result.get('error', 'Unknown error')}")
            except Exception as sync_error:
                print(f"Warning: Inventory sync error for invoice {invoice_id}: {str(sync_error)}")
                inventory_sync_result = {"success": False, "error": str(sync_error)}

        response_data = {"payment": db_payment}
        if inventory_sync_result:
            response_data["inventory_sync"] = inventory_sync_result

        return PaymentResponse(**response_data)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create payment: {str(e)}")


def get_invoice_payments_endpoint(
    invoice_id: str,
    db: Session,
    current_user: User,
    tenant_context: dict,
    page: int,
    limit: int,
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

        query = db.query(Payment).filter(
            and_(Payment.invoiceId == invoice_id, Payment.tenant_id == tenant_id)
        )

        total = query.count()
        payments = query.order_by(desc(Payment.createdAt)).offset((page - 1) * limit).limit(limit).all()
        pages = (total + limit - 1) // limit

        return PaymentsResponse(
            payments=payments,
            pagination={"page": page, "limit": limit, "total": total, "pages": pages},
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payments: {str(e)}")


def get_payments_endpoint(
    db: Session,
    current_user: User,
    tenant_context: dict,
    page: int,
    limit: int,
    invoice_id: Optional[str],
    payment_method: Optional[str],
    status: Optional[str],
    date_from: Optional[str],
    date_to: Optional[str],
    search: Optional[str],
):
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")

        tenant_id = tenant_context["tenant_id"]
        query = db.query(Payment).filter(Payment.tenant_id == tenant_id)

        if invoice_id:
            query = query.filter(Payment.invoiceId == invoice_id)
        if payment_method:
            query = query.filter(Payment.paymentMethod == payment_method)
        if status:
            query = query.filter(Payment.status == status)
        if date_from:
            query = query.filter(Payment.paymentDate >= date_from)
        if date_to:
            query = query.filter(Payment.paymentDate <= date_to)
        if search:
            search_filter = or_(
                Payment.reference.contains(search),
                Payment.notes.contains(search),
            )
            query = query.filter(search_filter)

        total = query.count()
        payments = query.order_by(desc(Payment.createdAt)).offset((page - 1) * limit).limit(limit).all()
        pages = (total + limit - 1) // limit

        return PaymentsResponse(
            payments=payments,
            pagination={"page": page, "limit": limit, "total": total, "pages": pages},
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payments: {str(e)}")
