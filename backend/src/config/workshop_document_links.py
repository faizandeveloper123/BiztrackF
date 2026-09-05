from typing import Optional
from sqlalchemy.orm import Session
from .inventory_models import PurchaseOrder
from .job_card_models import JobCard
from ..models.invoices.invoice import Invoice


def _normalize_id(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    return str(value)


def sync_workshop_document_links(
    db: Session,
    tenant_id: str,
    *,
    purchase_order_id: Optional[str] = None,
    job_card_id: Optional[str] = None,
    invoice_id: Optional[str] = None,
) -> None:
    po_id = _normalize_id(purchase_order_id)
    jc_id = _normalize_id(job_card_id)
    inv_id = _normalize_id(invoice_id)

    if po_id:
        stale_jc = db.query(JobCard).filter(
            JobCard.tenant_id == tenant_id,
            JobCard.purchase_order_id == po_id,
        )
        if jc_id:
            stale_jc = stale_jc.filter(JobCard.id != jc_id)
        stale_jc.update({JobCard.purchase_order_id: None}, synchronize_session=False)

    if jc_id:
        stale_po = db.query(PurchaseOrder).filter(
            PurchaseOrder.tenant_id == tenant_id,
            PurchaseOrder.jobCardId == jc_id,
        )
        if po_id:
            stale_po = stale_po.filter(PurchaseOrder.id != po_id)
        stale_po.update({PurchaseOrder.jobCardId: None}, synchronize_session=False)

        stale_inv = db.query(Invoice).filter(
            Invoice.tenant_id == tenant_id,
            Invoice.jobCardId == jc_id,
        )
        if inv_id:
            stale_inv = stale_inv.filter(Invoice.id != inv_id)
        stale_inv.update({Invoice.jobCardId: None}, synchronize_session=False)

    if inv_id:
        stale_jc = db.query(JobCard).filter(
            JobCard.tenant_id == tenant_id,
            JobCard.invoice_id == inv_id,
        )
        if jc_id:
            stale_jc = stale_jc.filter(JobCard.id != jc_id)
        stale_jc.update({JobCard.invoice_id: None}, synchronize_session=False)

    if po_id:
        po = db.query(PurchaseOrder).filter(
            PurchaseOrder.id == po_id,
            PurchaseOrder.tenant_id == tenant_id,
        ).first()
        if po:
            po.jobCardId = jc_id

    if jc_id:
        jc = db.query(JobCard).filter(
            JobCard.id == jc_id,
            JobCard.tenant_id == tenant_id,
        ).first()
        if jc:
            jc.purchase_order_id = po_id
            jc.invoice_id = inv_id

    if inv_id:
        inv = db.query(Invoice).filter(
            Invoice.id == inv_id,
            Invoice.tenant_id == tenant_id,
        ).first()
        if inv:
            inv.jobCardId = jc_id

    db.flush()
