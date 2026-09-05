import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from ......models.crm.lead_related import LeadAdditionalContact
from ...http_common import require_tenant, safe_uuid
from ..schemas import LeadAdditionalContactCreate
from .helpers import get_lead_or_404


def list_additional_contacts(lead_id: str, db: Session, current_user, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    rows = db.query(LeadAdditionalContact).filter(LeadAdditionalContact.leadId == lead.id).all()
    return [
        {
            "id": r.id,
            "leadId": r.leadId,
            "name": r.name,
            "phone": r.phone,
            "email": r.email,
            "relationshipLabel": r.relationshipLabel,
        }
        for r in rows
    ]


def create_additional_contact(lead_id: str, data: LeadAdditionalContactCreate, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = LeadAdditionalContact(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        leadId=lead.id,
        name=data.name,
        phone=data.phone,
        email=data.email,
        relationshipLabel=data.relationshipLabel,
        createdAt=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "leadId": row.leadId,
        "name": row.name,
        "phone": row.phone,
        "email": row.email,
        "relationshipLabel": row.relationshipLabel,
    }
