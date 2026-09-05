import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from ......models.crm import Lead
from ......models.crm.lead_related import LeadPipelineHistory, LeadNote
from ...http_common import require_tenant, safe_uuid
from .helpers import uid, get_lead_or_404


def record_pipeline_history(db: Session, lead: Lead, stage: str, user_id, tenant_id) -> LeadPipelineHistory:
    row = LeadPipelineHistory(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(tenant_id),
        leadId=lead.id,
        pipelineStage=stage,
        changedAt=datetime.utcnow(),
        changedById=uid(user_id),
        createdAt=datetime.utcnow(),
    )
    db.add(row)
    return row


def set_pipeline(lead: Lead, stage: str, current_user, db: Session, tenant_context) -> Lead:
    ctx = require_tenant(tenant_context)
    old = lead.pipelineStage
    lead.pipelineStage = stage
    lead.updatedAt = datetime.utcnow()
    if old != stage:
        record_pipeline_history(db, lead, stage, current_user.id, ctx["tenant_id"])
        system = LeadNote(
            id=uuid.uuid4(),
            tenant_id=safe_uuid(ctx["tenant_id"]),
            leadId=lead.id,
            commType="note",
            content=f"Pipeline changed to {stage.replace('_', ' ').title()}",
            occurredAt=datetime.utcnow(),
            createdById=uid(current_user.id),
            isSystem=True,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow(),
        )
        db.add(system)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


def list_pipeline_history(lead_id: str, db: Session, current_user, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    rows = (
        db.query(LeadPipelineHistory)
        .filter(LeadPipelineHistory.leadId == lead.id)
        .order_by(LeadPipelineHistory.changedAt.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "pipelineStage": r.pipelineStage,
            "changedAt": r.changedAt,
            "changedById": str(r.changedById) if r.changedById else None,
        }
        for r in rows
    ]
