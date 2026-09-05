import uuid
from typing import Optional

from sqlalchemy.orm import Session

from ......models.crm import Lead
from ......models.crm.lead_related import LeadNote, LeadTask, LeadEmail, LeadSms
from ......models.platform.user import User
from ......services.email_service import EmailService
from ...http_common import safe_uuid, tenant_id_optional, user_display_name, visible_or_404

email_service = EmailService()

STATUS_TO_PIPELINE = {
    "new": "new_lead",
    "contacted": "tried_to_contact",
    "qualified": "qualified",
    "proposal_sent": "made_contact",
    "proposal": "made_contact",
    "negotiation": "made_contact",
    "won": "closed",
    "converted": "closed",
    "closed": "closed",
    "lost": "lost",
    "open": "new_lead",
}


def uid(v) -> Optional[uuid.UUID]:
    if v is None or v == "":
        return None
    return safe_uuid(v)


def user_name(db: Session, user_id) -> Optional[str]:
    if not user_id:
        return None
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        return None
    return user_display_name(u)


def get_lead_or_404(lead_id: str, db: Session, current_user, tenant_context) -> Lead:
    tid = tenant_id_optional(tenant_context)
    lead = db.query(Lead).filter(Lead.id == safe_uuid(lead_id))
    if tid:
        lead = lead.filter(Lead.tenant_id == safe_uuid(tid))
    lead = lead.first()
    return visible_or_404(lead, tenant_context, current_user, detail="Lead not found")


def refresh_lead_aggregates(lead: Lead, db: Session) -> None:
    notes = db.query(LeadNote).filter(LeadNote.leadId == lead.id).all()
    emails = db.query(LeadEmail).filter(LeadEmail.leadId == lead.id).all()
    sms_rows = db.query(LeadSms).filter(LeadSms.leadId == lead.id).all()
    tasks = db.query(LeadTask).filter(LeadTask.leadId == lead.id).all()

    call_notes = [n for n in notes if n.commType == "call"]
    lead.callCount = len(call_notes)
    lead.emailCount = len(emails)
    lead.smsCount = len(sms_rows)

    if call_notes:
        lead.lastCallAt = max((n.occurredAt or n.createdAt for n in call_notes), default=None)
    if emails:
        lead.lastEmailAt = max((e.sentAt or e.createdAt for e in emails), default=None)
    if sms_rows:
        lead.lastSmsAt = max((s.sentAt or s.createdAt for s in sms_rows), default=None)

    timestamps = []
    if lead.lastCallAt:
        timestamps.append(("call", lead.lastCallAt))
    if lead.lastEmailAt:
        timestamps.append(("email", lead.lastEmailAt))
    if lead.lastSmsAt:
        timestamps.append(("sms", lead.lastSmsAt))
    if timestamps:
        channel, ts = max(timestamps, key=lambda x: x[1])
        lead.lastContactAt = ts
        lead.lastContactChannel = channel

    open_tasks = [t for t in tasks if t.status not in ("completed", "cancelled")]
    lead.hasOpenTask = len(open_tasks) > 0
    lead.hasFlaggedTask = any(t.flagged for t in open_tasks)
    db.add(lead)
