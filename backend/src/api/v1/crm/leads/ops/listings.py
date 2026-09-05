import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ......models.crm import Lead
from ......models.crm.lead_related import LeadListingSearch
from ...http_common import require_tenant, safe_uuid
from ..schemas import LeadListingSearchCreate, LeadEmailCompose
from .helpers import get_lead_or_404, email_service
from .emails import compose_email


def list_listing_searches(lead_id: str, db: Session, current_user, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    rows = db.query(LeadListingSearch).filter(LeadListingSearch.leadId == lead.id).all()
    return [
        {
            "id": r.id,
            "leadId": r.leadId,
            "name": r.name,
            "criteria": r.criteria or {},
            "city": r.city,
            "priceMin": r.priceMin,
            "priceMax": r.priceMax,
            "propertyTypes": r.propertyTypes or [],
            "emailsSent": r.emailsSent or 0,
            "lastSentAt": r.lastSentAt,
            "nextSendAt": r.nextSendAt,
            "intervalHours": r.intervalHours or 24,
            "active": bool(r.active),
        }
        for r in rows
    ]


def create_listing_search(lead_id: str, data: LeadListingSearchCreate, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    now = datetime.utcnow()
    row = LeadListingSearch(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        leadId=lead.id,
        name=data.name,
        criteria=data.criteria or {},
        city=data.city,
        priceMin=data.priceMin,
        priceMax=data.priceMax,
        propertyTypes=data.propertyTypes or [],
        emailsSent=0,
        nextSendAt=now + timedelta(hours=data.intervalHours or 24),
        intervalHours=data.intervalHours or 24,
        active=True,
        createdAt=now,
        updatedAt=now,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "leadId": row.leadId,
        "name": row.name,
        "criteria": row.criteria or {},
        "city": row.city,
        "priceMin": row.priceMin,
        "priceMax": row.priceMax,
        "propertyTypes": row.propertyTypes or [],
        "emailsSent": 0,
        "lastSentAt": None,
        "nextSendAt": row.nextSendAt,
        "intervalHours": row.intervalHours,
        "active": True,
    }


def delete_listing_search(lead_id: str, search_id: str, current_user, db: Session, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = db.query(LeadListingSearch).filter(
        LeadListingSearch.id == safe_uuid(search_id), LeadListingSearch.leadId == lead.id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Search not found")
    db.delete(row)
    db.commit()
    return {"message": "Search deleted"}


def run_listing_alert(lead_id: str, search_id: str, current_user, db: Session, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = db.query(LeadListingSearch).filter(
        LeadListingSearch.id == safe_uuid(search_id), LeadListingSearch.leadId == lead.id
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Search not found")
    price = ""
    if row.priceMin or row.priceMax:
        price = f"${row.priceMin or 0:,.0f} - ${row.priceMax or 0:,.0f}"
    body = (
        f"Hi {lead.firstName}, new listings matching your search '{row.name}'"
        f"{(' in ' + row.city) if row.city else ''}"
        f"{(' — ' + price) if price else ''}."
    )
    compose_email(
        lead_id,
        LeadEmailCompose(subject=f"New listings for {row.name}", body=body),
        current_user,
        db,
        tenant_context,
    )
    now = datetime.utcnow()
    row.emailsSent = (row.emailsSent or 0) + 1
    row.lastSentAt = now
    row.nextSendAt = now + timedelta(hours=row.intervalHours or 24)
    row.updatedAt = now
    db.commit()
    return {"message": "Alert sent", "emailsSent": row.emailsSent, "nextSendAt": row.nextSendAt}


def process_due_listing_alerts(db: Session):
    now = datetime.utcnow()
    due = (
        db.query(LeadListingSearch)
        .filter(LeadListingSearch.active.is_(True), LeadListingSearch.nextSendAt <= now)
        .all()
    )
    count = 0
    for row in due:
        lead = db.query(Lead).filter(Lead.id == row.leadId).first()
        if not lead:
            continue
        body = f"Hi {lead.firstName}, new listings matching your search '{row.name}'."
        email_service.send_lead_email(
            lead.email,
            f"New listings for {row.name}",
            body,
            body,
        )
        row.emailsSent = (row.emailsSent or 0) + 1
        row.lastSentAt = now
        row.nextSendAt = now + timedelta(hours=row.intervalHours or 24)
        count += 1
    db.commit()
    return {"processed": count}
