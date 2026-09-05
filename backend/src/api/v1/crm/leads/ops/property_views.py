import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from ......models.crm.lead_related import LeadPropertyView
from ...http_common import require_tenant, safe_uuid
from ..schemas import LeadPropertyViewCreate
from .helpers import get_lead_or_404


def list_property_views(lead_id: str, db: Session, current_user, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    rows = (
        db.query(LeadPropertyView)
        .filter(LeadPropertyView.leadId == lead.id)
        .order_by(LeadPropertyView.viewedAt.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "leadId": r.leadId,
            "propertyType": r.propertyType,
            "beds": r.beds,
            "baths": r.baths,
            "price": r.price,
            "city": r.city,
            "address": r.address,
            "mlsNumber": r.mlsNumber,
            "viewedAt": r.viewedAt,
        }
        for r in rows
    ]


def create_property_view(lead_id: str, data: LeadPropertyViewCreate, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = LeadPropertyView(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        leadId=lead.id,
        propertyType=data.propertyType,
        beds=data.beds,
        baths=data.baths,
        price=data.price,
        city=data.city,
        address=data.address,
        mlsNumber=data.mlsNumber,
        viewedAt=data.viewedAt or datetime.utcnow(),
        createdAt=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "leadId": row.leadId,
        "propertyType": row.propertyType,
        "beds": row.beds,
        "baths": row.baths,
        "price": row.price,
        "city": row.city,
        "address": row.address,
        "mlsNumber": row.mlsNumber,
        "viewedAt": row.viewedAt,
    }
