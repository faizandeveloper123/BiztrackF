import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from ......models.crm import Lead
from ......models.crm.lead_related import LeadEmail
from ...http_common import require_tenant, safe_uuid
from ..schemas import LeadEmailCompose
from .helpers import uid, get_lead_or_404, refresh_lead_aggregates, email_service


def list_emails(lead_id: str, db: Session, current_user, tenant_context, direction: Optional[str] = None):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    q = db.query(LeadEmail).filter(LeadEmail.leadId == lead.id)
    if direction:
        q = q.filter(LeadEmail.direction == direction)
    rows = q.order_by(LeadEmail.createdAt.desc()).all()
    return [
        {
            "id": r.id,
            "leadId": r.leadId,
            "subject": r.subject,
            "body": r.body,
            "direction": r.direction,
            "status": r.status,
            "toEmail": r.toEmail,
            "fromEmail": r.fromEmail,
            "sentAt": r.sentAt,
            "openedAt": r.openedAt,
            "createdAt": r.createdAt,
        }
        for r in rows
    ]


def compose_email(lead_id: str, data: LeadEmailCompose, current_user, db: Session, tenant_context, track_base_url: str = ""):
    ctx = require_tenant(tenant_context)
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    to_email = data.toEmail or lead.email
    token = str(uuid.uuid4())
    pixel = ""
    if track_base_url:
        pixel = f'<img src="{track_base_url.rstrip("/")}/crm/leads/email-track/{token}.gif" width="1" height="1" alt="" />'
    html_body = f"{data.body}<br/>{pixel}"
    row = LeadEmail(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        leadId=lead.id,
        subject=data.subject,
        body=data.body,
        direction="outgoing",
        status="queued",
        trackingToken=token,
        toEmail=to_email,
        fromEmail=email_service.from_email,
        createdById=uid(current_user.id),
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(row)
    sent = email_service.send_lead_email(to_email, data.subject, html_body, data.body)
    if sent:
        row.status = "delivered"
        row.sentAt = datetime.utcnow()
    else:
        row.status = "failed" if email_service.smtp_configured() else "queued"
    refresh_lead_aggregates(lead, db)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "leadId": row.leadId,
        "subject": row.subject,
        "body": row.body,
        "direction": row.direction,
        "status": row.status,
        "toEmail": row.toEmail,
        "fromEmail": row.fromEmail,
        "sentAt": row.sentAt,
        "openedAt": row.openedAt,
        "createdAt": row.createdAt,
        "smtpConfigured": email_service.smtp_configured(),
    }


def track_email_open(token: str, db: Session):
    row = db.query(LeadEmail).filter(LeadEmail.trackingToken == token).first()
    if row and not row.openedAt:
        row.openedAt = datetime.utcnow()
        row.status = "opened"
        lead = db.query(Lead).filter(Lead.id == row.leadId).first()
        if lead:
            refresh_lead_aggregates(lead, db)
        db.commit()
    return True
