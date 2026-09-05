import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from ..models.crm import Contact, Lead, Opportunity, SalesActivity
from ..models.crm.client_payment_ledger import ClientPaymentLedger
from ..models.invoices import Invoice, Payment
from ..config.installment_models import Installment, InstallmentPlan


def _uid(value) -> Optional[uuid.UUID]:
    if value is None:
        return None
    try:
        return uuid.UUID(str(value))
    except (ValueError, TypeError):
        return None


def resolve_contact_for_invoice(db: Session, invoice: Invoice) -> Optional[uuid.UUID]:
    if invoice.contactId:
        return _uid(invoice.contactId)
    if invoice.opportunityId:
        opp = db.query(Opportunity).filter(Opportunity.id == _uid(invoice.opportunityId)).first()
        if not opp:
            opp = db.query(Opportunity).filter(Opportunity.id == invoice.opportunityId).first()
        if opp and opp.contactId:
            invoice.contactId = opp.contactId
            return _uid(opp.contactId)
    if invoice.customerEmail:
        em = invoice.customerEmail.strip().lower()
        contact = db.query(Contact).filter(
            Contact.tenant_id == invoice.tenant_id,
            Contact.email.ilike(em),
        ).first()
        if contact:
            invoice.contactId = contact.id
            return contact.id
    return None


def touch_contact_last_contacted(db: Session, contact_id, when: Optional[datetime] = None) -> None:
    cid = _uid(contact_id)
    if not cid:
        return
    contact = db.query(Contact).filter(Contact.id == cid).first()
    if not contact:
        return
    now = when or datetime.utcnow()
    if not contact.lastContactDate or contact.lastContactDate < now:
        contact.lastContactDate = now
        contact.updatedAt = datetime.utcnow()


def record_ledger_entry(
    db: Session,
    tenant_id,
    amount: float,
    entry_type: str,
    revenue_type: str = "realized",
    contact_id=None,
    opportunity_id=None,
    invoice_id=None,
    payment_id=None,
    installment_id=None,
    assigned_to_id=None,
    description: Optional[str] = None,
    entry_date: Optional[datetime] = None,
) -> ClientPaymentLedger:
    entry = ClientPaymentLedger(
        tenant_id=_uid(tenant_id),
        contactId=_uid(contact_id),
        opportunityId=_uid(opportunity_id),
        invoiceId=_uid(invoice_id),
        paymentId=_uid(payment_id),
        installmentId=_uid(installment_id),
        assignedToId=_uid(assigned_to_id),
        entryType=entry_type,
        revenueType=revenue_type,
        amount=float(amount or 0),
        description=description,
        entryDate=entry_date or datetime.utcnow(),
    )
    db.add(entry)
    return entry


def evaluate_agent_gamification(db: Session, tenant_id: str, user_id: str) -> None:
    try:
        from .agent_portal_service import evaluate_badges, persist_new_badges
        badges = evaluate_badges(db, tenant_id, user_id)
        persist_new_badges(db, tenant_id, user_id, badges)
    except Exception:
        pass


def sync_on_invoice_created(db: Session, invoice: Invoice) -> None:
    resolve_contact_for_invoice(db, invoice)
    db.flush()


def sync_on_payment(db: Session, payment: Payment, invoice: Invoice, agent_user_id: Optional[str] = None) -> None:
    contact_id = resolve_contact_for_invoice(db, invoice)
    agent_id = agent_user_id
    if not agent_id and contact_id:
        c = db.query(Contact).filter(Contact.id == contact_id).first()
        if c and c.assignedToId:
            agent_id = str(c.assignedToId)
    if not agent_id:
        agent_id = str(invoice.createdBy) if invoice.createdBy else None
    if contact_id:
        touch_contact_last_contacted(db, contact_id, payment.paymentDate)
    opp_id = _uid(invoice.opportunityId) if invoice.opportunityId else None
    record_ledger_entry(
        db,
        payment.tenant_id,
        float(payment.amount or 0),
        entry_type="payment",
        revenue_type="realized",
        contact_id=contact_id,
        opportunity_id=opp_id,
        invoice_id=invoice.id,
        payment_id=payment.id,
        assigned_to_id=agent_id,
        description=f"Payment for invoice {invoice.invoiceNumber or invoice.id}",
        entry_date=payment.paymentDate,
    )
    if agent_id:
        evaluate_agent_gamification(db, str(payment.tenant_id), agent_id)


def sync_on_installment_payment(
    db: Session,
    installment: Installment,
    plan: InstallmentPlan,
    amount: float,
    payment_id: Optional[str],
    agent_user_id: Optional[str] = None,
) -> None:
    invoice = db.query(Invoice).filter(Invoice.id == plan.invoice_id).first()
    if not invoice:
        return
    contact_id = resolve_contact_for_invoice(db, invoice)
    agent_id = agent_user_id or (str(invoice.createdBy) if invoice.createdBy else None)
    if contact_id:
        touch_contact_last_contacted(db, contact_id)
    record_ledger_entry(
        db,
        installment.tenant_id,
        float(amount or 0),
        entry_type="installment",
        revenue_type="realized",
        contact_id=contact_id,
        opportunity_id=_uid(invoice.opportunityId) if invoice.opportunityId else None,
        invoice_id=invoice.id,
        payment_id=_uid(payment_id),
        installment_id=installment.id,
        assigned_to_id=agent_id,
        description=f"Installment #{installment.sequence_number}",
        entry_date=datetime.utcnow(),
    )
    if agent_id:
        evaluate_agent_gamification(db, str(installment.tenant_id), agent_id)


def sync_on_opportunity_closed(db: Session, opportunity: Opportunity) -> None:
    if opportunity.stage != "closed_won":
        return
    if not opportunity.wonAmount and opportunity.amount:
        opportunity.wonAmount = opportunity.amount
    if not opportunity.closedDate:
        opportunity.closedDate = datetime.utcnow()
    contact_id = opportunity.contactId
    if contact_id:
        contact = db.query(Contact).filter(Contact.id == contact_id).first()
        if contact:
            if contact.clientValue is None and opportunity.amount:
                contact.clientValue = float(opportunity.amount)
            touch_contact_last_contacted(db, contact_id, opportunity.closedDate)
    deal_value = float(opportunity.wonAmount or opportunity.amount or 0)
    record_ledger_entry(
        db,
        opportunity.tenant_id,
        deal_value,
        entry_type="deal_closed",
        revenue_type="pending",
        contact_id=contact_id,
        opportunity_id=opportunity.id,
        assigned_to_id=opportunity.assignedToId,
        description=f"Deal closed: {opportunity.name}",
        entry_date=opportunity.closedDate or datetime.utcnow(),
    )
    if opportunity.assignedToId:
        evaluate_agent_gamification(db, str(opportunity.tenant_id), str(opportunity.assignedToId))


def sync_on_lead_status_change(db: Session, lead: Lead, new_status: str) -> None:
    if new_status in ("contacted", "qualified", "proposal_sent", "negotiation", "won"):
        contact = None
        if lead.email:
            contact = db.query(Contact).filter(
                Contact.tenant_id == lead.tenant_id,
                Contact.email.ilike(lead.email.strip()),
            ).first()
        if contact:
            touch_contact_last_contacted(db, contact.id)
    if lead.assignedToId:
        evaluate_agent_gamification(db, str(lead.tenant_id), str(lead.assignedToId))


def sync_on_activity_completed(db: Session, activity: SalesActivity) -> None:
    if activity.status != "completed" and not activity.completedAt:
        return
    if activity.relatedToType == "contact" and activity.relatedToId:
        touch_contact_last_contacted(db, activity.relatedToId, activity.completedAt or datetime.utcnow())
    elif activity.relatedToType == "lead" and activity.relatedToId:
        lead = db.query(Lead).filter(Lead.id == activity.relatedToId).first()
        if lead and lead.email:
            contact = db.query(Contact).filter(
                Contact.tenant_id == lead.tenant_id,
                Contact.email.ilike(lead.email.strip()),
            ).first()
            if contact:
                touch_contact_last_contacted(db, contact.id, activity.completedAt or datetime.utcnow())
    if activity.assignedToId:
        evaluate_agent_gamification(db, str(activity.tenant_id), str(activity.assignedToId))


def get_contact_ledger(db: Session, tenant_id: str, contact_id: str, limit: int = 100):
    tid = _uid(tenant_id)
    cid = _uid(contact_id)
    return (
        db.query(ClientPaymentLedger)
        .filter(ClientPaymentLedger.tenant_id == tid, ClientPaymentLedger.contactId == cid)
        .order_by(ClientPaymentLedger.entryDate.desc())
        .limit(limit)
        .all()
    )
