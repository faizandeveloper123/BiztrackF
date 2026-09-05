from sqlalchemy.orm import Session

from ......models.crm import Lead
from ......models.crm.lead_related import (
    LeadAdditionalContact,
    LeadTask,
    LeadPropertyView,
    LeadListingSearch,
)
from ......services.twilio_service import twilio_service
from .helpers import email_service
from .tasks import serialize_task


def build_lead_detail(lead: Lead, db: Session) -> dict:
    from ..schemas import Lead as LeadSchema

    base = LeadSchema.model_validate(lead).model_dump()
    additional = (
        db.query(LeadAdditionalContact).filter(LeadAdditionalContact.leadId == lead.id).all()
    )
    open_tasks = (
        db.query(LeadTask)
        .filter(LeadTask.leadId == lead.id, LeadTask.status.notin_(["completed", "cancelled"]))
        .order_by(LeadTask.dueAt.asc().nullslast())
        .all()
    )
    views = (
        db.query(LeadPropertyView)
        .filter(LeadPropertyView.leadId == lead.id)
        .order_by(LeadPropertyView.viewedAt.desc())
        .all()
    )
    searches = db.query(LeadListingSearch).filter(LeadListingSearch.leadId == lead.id).all()
    last_view = views[0] if views else None
    summary = None
    if views:
        cities = {v.city for v in views if v.city}
        types = {}
        prices = [v.price for v in views if v.price is not None]
        for v in views:
            if v.propertyType:
                types[v.propertyType] = types.get(v.propertyType, 0) + 1
        summary = {
            "count": len(views),
            "types": types,
            "priceMin": min(prices) if prices else None,
            "priceMax": max(prices) if prices else None,
            "cities": list(cities),
            "beds": last_view.beds if last_view else None,
            "baths": last_view.baths if last_view else None,
        }
    base.update(
        {
            "additionalContacts": [
                {
                    "id": a.id,
                    "name": a.name,
                    "phone": a.phone,
                    "email": a.email,
                    "relationshipLabel": a.relationshipLabel,
                }
                for a in additional
            ],
            "openTask": serialize_task(open_tasks[0], db) if open_tasks else None,
            "lastPropertyView": (
                {
                    "id": last_view.id,
                    "propertyType": last_view.propertyType,
                    "beds": last_view.beds,
                    "baths": last_view.baths,
                    "price": last_view.price,
                    "city": last_view.city,
                    "viewedAt": last_view.viewedAt,
                }
                if last_view
                else None
            ),
            "propertyViewSummary": summary,
            "listingSearches": [
                {
                    "id": s.id,
                    "name": s.name,
                    "city": s.city,
                    "priceMin": s.priceMin,
                    "priceMax": s.priceMax,
                    "emailsSent": s.emailsSent or 0,
                    "lastSentAt": s.lastSentAt,
                    "nextSendAt": s.nextSendAt,
                    "active": bool(s.active),
                    "criteria": s.criteria or {},
                    "propertyTypes": s.propertyTypes or [],
                }
                for s in searches
            ],
            "integrations": {
                "twilioConfigured": twilio_service.configured,
                "smtpConfigured": email_service.smtp_configured(),
            },
        }
    )
    return base


def integration_status():
    return {
        "twilioConfigured": twilio_service.configured,
        "smtpConfigured": email_service.smtp_configured(),
    }
