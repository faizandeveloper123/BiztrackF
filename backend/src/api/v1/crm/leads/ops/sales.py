import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from ......models.crm.lead_related import LeadSale
from ...http_common import require_tenant, safe_uuid
from ..schemas import LeadSaleCreate
from .helpers import uid, get_lead_or_404


def list_sales(lead_id: str, db: Session, current_user, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    rows = db.query(LeadSale).filter(LeadSale.leadId == lead.id).all()
    return [
        {
            "id": r.id,
            "leadId": r.leadId,
            "agentRole": r.agentRole,
            "closingDate": r.closingDate,
            "mlsNumber": r.mlsNumber,
            "sellingPrice": r.sellingPrice,
            "createdAt": r.createdAt,
        }
        for r in rows
    ]


def create_sale(lead_id: str, data: LeadSaleCreate, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = LeadSale(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        leadId=lead.id,
        agentRole=data.agentRole,
        closingDate=data.closingDate,
        mlsNumber=data.mlsNumber,
        sellingPrice=data.sellingPrice,
        createdById=uid(current_user.id),
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "leadId": row.leadId,
        "agentRole": row.agentRole,
        "closingDate": row.closingDate,
        "mlsNumber": row.mlsNumber,
        "sellingPrice": row.sellingPrice,
        "createdAt": row.createdAt,
    }
