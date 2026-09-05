import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ......models.crm.lead_related import LeadNote
from ...http_common import require_tenant, safe_uuid
from ..schemas import LeadNoteCreate, LeadNoteUpdate
from .helpers import uid, user_name, get_lead_or_404, refresh_lead_aggregates
from .pipeline import record_pipeline_history


def serialize_note(n: LeadNote, db: Session) -> dict:
    return {
        "id": n.id,
        "leadId": n.leadId,
        "commType": n.commType,
        "callResult": n.callResult,
        "content": n.content,
        "occurredAt": n.occurredAt,
        "createdById": str(n.createdById) if n.createdById else None,
        "createdByName": user_name(db, n.createdById),
        "isSystem": bool(n.isSystem),
        "createdAt": n.createdAt,
    }


def list_notes(lead_id: str, db: Session, current_user, tenant_context, hide_system: bool = False):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    q = db.query(LeadNote).filter(LeadNote.leadId == lead.id).order_by(LeadNote.occurredAt.desc())
    rows = q.all()
    if hide_system:
        rows = [r for r in rows if not r.isSystem]
    return [serialize_note(r, db) for r in rows]


def create_note(lead_id: str, data: LeadNoteCreate, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = LeadNote(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        leadId=lead.id,
        commType=data.commType or "note",
        callResult=data.callResult,
        content=data.content,
        occurredAt=data.occurredAt or datetime.utcnow(),
        createdById=uid(current_user.id),
        isSystem=False,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(row)
    if data.commType == "call" and lead.pipelineStage == "new_lead":
        lead.pipelineStage = "tried_to_contact"
        record_pipeline_history(db, lead, "tried_to_contact", current_user.id, ctx["tenant_id"])
    refresh_lead_aggregates(lead, db)
    db.commit()
    db.refresh(row)
    return serialize_note(row, db)


def update_note(lead_id: str, note_id: str, data: LeadNoteUpdate, current_user, db: Session, tenant_context):
    get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = db.query(LeadNote).filter(LeadNote.id == safe_uuid(note_id), LeadNote.leadId == safe_uuid(lead_id)).first()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    row.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return serialize_note(row, db)


def delete_note(lead_id: str, note_id: str, current_user, db: Session, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = db.query(LeadNote).filter(LeadNote.id == safe_uuid(note_id), LeadNote.leadId == lead.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(row)
    refresh_lead_aggregates(lead, db)
    db.commit()
    return {"message": "Note deleted"}
