from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import func, case, and_, text
from sqlalchemy.orm import Session

from ....models.invoices import Invoice, Payment, InvoiceShareLink, DeliveryNote
from ....core.cache import cached_sync


def _parse_uuid(value: str) -> UUID:
    return value if isinstance(value, UUID) else UUID(str(value))


def _delete_legacy_invoice_items(db: Session, invoice_id: UUID) -> None:
    table_check = db.execute(
        text(
            """
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'invoice_items'
            """
        )
    ).scalar()
    if not table_check:
        return

    columns = db.execute(
        text(
            """
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'invoice_items'
            AND column_name IN ('invoiceId', 'invoice_id')
            """
        )
    ).fetchall()
    for (column_name,) in columns:
        if column_name == "invoiceId":
            db.execute(
                text('DELETE FROM invoice_items WHERE "invoiceId" = :invoice_id'),
                {"invoice_id": invoice_id},
            )
        else:
            db.execute(
                text("DELETE FROM invoice_items WHERE invoice_id = :invoice_id"),
                {"invoice_id": invoice_id},
            )


def delete_invoice_dependencies(
    db: Session, invoice_id: str, tenant_id: Optional[str] = None
) -> None:
    invoice_uuid = _parse_uuid(invoice_id)
    tenant_uuid = _parse_uuid(tenant_id) if tenant_id else None

    share_query = db.query(InvoiceShareLink).filter(
        InvoiceShareLink.invoice_id == invoice_uuid
    )
    if tenant_uuid:
        share_query = share_query.filter(InvoiceShareLink.tenant_id == tenant_uuid)
    share_query.delete(synchronize_session=False)

    delivery_query = db.query(DeliveryNote).filter(
        DeliveryNote.invoice_id == invoice_uuid
    )
    if tenant_uuid:
        delivery_query = delivery_query.filter(DeliveryNote.tenant_id == tenant_uuid)
    delivery_query.delete(synchronize_session=False)

    try:
        from ....config.installment_models import InstallmentPlan, Installment

        plan_query = db.query(InstallmentPlan).filter(
            InstallmentPlan.invoice_id == invoice_uuid
        )
        if tenant_uuid:
            plan_query = plan_query.filter(InstallmentPlan.tenant_id == tenant_uuid)
        plan_ids = [plan.id for plan in plan_query.all()]
        if plan_ids:
            installment_query = db.query(Installment).filter(
                Installment.installment_plan_id.in_(plan_ids)
            )
            if tenant_uuid:
                installment_query = installment_query.filter(
                    Installment.tenant_id == tenant_uuid
                )
            installment_query.delete(synchronize_session=False)
            plan_query.delete(synchronize_session=False)
    except Exception:
        pass

    payment_query = db.query(Payment).filter(Payment.invoiceId == invoice_uuid)
    if tenant_uuid:
        payment_query = payment_query.filter(Payment.tenant_id == tenant_uuid)
    payment_query.delete(synchronize_session=False)

    try:
        from ....config.job_card_models import JobCard

        job_card_query = db.query(JobCard).filter(JobCard.invoice_id == invoice_uuid)
        if tenant_uuid:
            job_card_query = job_card_query.filter(JobCard.tenant_id == tenant_uuid)
        job_card_query.update(
            {JobCard.invoice_id: None}, synchronize_session=False
        )
    except Exception:
        pass

    try:
        from ....models.banking import BankTransaction

        bank_query = db.query(BankTransaction).filter(
            BankTransaction.related_invoice_id == invoice_uuid
        )
        if tenant_uuid:
            bank_query = bank_query.filter(BankTransaction.tenant_id == tenant_uuid)
        bank_query.update(
            {BankTransaction.related_invoice_id: None}, synchronize_session=False
        )
    except Exception:
        pass

    try:
        from ....models.crm.client_payment_ledger import ClientPaymentLedger

        cpl_query = db.query(ClientPaymentLedger).filter(
            ClientPaymentLedger.invoiceId == invoice_uuid
        )
        if tenant_uuid:
            cpl_query = cpl_query.filter(ClientPaymentLedger.tenant_id == tenant_uuid)
        cpl_query.update(
            {ClientPaymentLedger.invoiceId: None}, synchronize_session=False
        )
    except Exception:
        pass

    try:
        from ....config.ledger_models import AccountReceivable

        ar_query = db.query(AccountReceivable).filter(
            AccountReceivable.invoice_id == str(invoice_uuid)
        )
        if tenant_uuid:
            ar_query = ar_query.filter(AccountReceivable.tenant_id == tenant_uuid)
        ar_query.delete(synchronize_session=False)
    except Exception:
        pass

    _delete_legacy_invoice_items(db, invoice_uuid)
