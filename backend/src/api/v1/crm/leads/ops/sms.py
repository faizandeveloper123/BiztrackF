import uuid
from datetime import datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ......models.crm import Lead
from ......models.crm.lead_related import LeadSms
from ......services.twilio_service import twilio_service
from ...http_common import require_tenant, safe_uuid
from ..schemas import LeadSmsSend
from .helpers import uid, get_lead_or_404, refresh_lead_aggregates


def list_sms(lead_id: str, db: Session, current_user, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    rows = db.query(LeadSms).filter(LeadSms.leadId == lead.id).order_by(LeadSms.createdAt.asc()).all()
    return [
        {
            "id": r.id,
            "leadId": r.leadId,
            "body": r.body,
            "direction": r.direction,
            "status": r.status,
            "toPhone": r.toPhone,
            "fromPhone": r.fromPhone,
            "twilioSid": r.twilioSid,
            "sentAt": r.sentAt,
            "createdAt": r.createdAt,
        }
        for r in rows
    ]


def send_sms(lead_id: str, data: LeadSmsSend, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    if not lead.receiveSms:
        raise HTTPException(status_code=400, detail="Lead has SMS receive disabled")
    to_phone = data.toPhone or lead.phone or lead.workPhone or lead.homePhone
    if not to_phone:
        raise HTTPException(status_code=400, detail="No phone number on lead")
    row = LeadSms(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        leadId=lead.id,
        body=data.body,
        direction="outgoing",
        status="queued",
        toPhone=to_phone,
        fromPhone=twilio_service.phone_number or None,
        createdById=uid(current_user.id),
        createdAt=datetime.utcnow(),
    )
    db.add(row)
    ok, sid, err = twilio_service.send_sms(to_phone, data.body)
    if ok:
        row.status = "delivered"
        row.twilioSid = sid
        row.sentAt = datetime.utcnow()
    else:
        row.status = "failed"
    refresh_lead_aggregates(lead, db)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "leadId": row.leadId,
        "body": row.body,
        "direction": row.direction,
        "status": row.status,
        "toPhone": row.toPhone,
        "fromPhone": row.fromPhone,
        "twilioSid": row.twilioSid,
        "sentAt": row.sentAt,
        "createdAt": row.createdAt,
        "twilioConfigured": twilio_service.configured,
        "error": err,
    }


def inbound_sms_webhook(from_phone: str, body: str, sid: Optional[str], db: Session):
    digit = "".join(c for c in (from_phone or "") if c.isdigit())
    leads = db.query(Lead).all()
    match = None
    for lead in leads:
        for phone in (lead.phone, lead.workPhone, lead.homePhone):
            if phone and digit and digit[-7:] in "".join(c for c in phone if c.isdigit()):
                match = lead
                break
        if match:
            break
    if not match:
        return {"message": "No matching lead"}
    row = LeadSms(
        id=uuid.uuid4(),
        tenant_id=match.tenant_id,
        leadId=match.id,
        body=body or "",
        direction="incoming",
        status="delivered",
        twilioSid=sid,
        toPhone=twilio_service.phone_number,
        fromPhone=from_phone,
        sentAt=datetime.utcnow(),
        createdAt=datetime.utcnow(),
    )
    db.add(row)
    refresh_lead_aggregates(match, db)
    db.commit()
    return {"message": "SMS logged", "leadId": str(match.id)}
