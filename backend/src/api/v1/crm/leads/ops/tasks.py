import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ......models.crm.lead_related import LeadTask
from ...http_common import require_tenant, safe_uuid
from ..schemas import LeadTaskCreate, LeadTaskUpdate
from .helpers import uid, user_name, get_lead_or_404, refresh_lead_aggregates


def serialize_task(t: LeadTask, db: Session) -> dict:
    overdue = bool(
        t.dueAt
        and t.status not in ("completed", "cancelled")
        and t.dueAt < datetime.utcnow()
    )
    return {
        "id": t.id,
        "leadId": t.leadId,
        "title": t.title,
        "details": t.details,
        "assignedToId": str(t.assignedToId) if t.assignedToId else None,
        "assignedToName": user_name(db, t.assignedToId),
        "createdById": str(t.createdById) if t.createdById else None,
        "createdByName": user_name(db, t.createdById),
        "status": t.status,
        "priority": t.priority,
        "dueAt": t.dueAt,
        "reminder": t.reminder,
        "completedAt": t.completedAt,
        "flagged": bool(t.flagged),
        "overdue": overdue,
        "createdAt": t.createdAt,
    }


def list_tasks(lead_id: str, db: Session, current_user, tenant_context, include_completed: bool = False):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    rows = db.query(LeadTask).filter(LeadTask.leadId == lead.id).order_by(LeadTask.dueAt.asc().nullslast()).all()
    if not include_completed:
        rows = [r for r in rows if r.status != "completed"]
    return [serialize_task(r, db) for r in rows]


def create_task(lead_id: str, data: LeadTaskCreate, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = LeadTask(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        leadId=lead.id,
        title=data.title,
        details=data.details,
        assignedToId=uid(data.assignedToId) or uid(current_user.id),
        createdById=uid(current_user.id),
        status=data.status,
        priority=data.priority,
        dueAt=data.dueAt,
        reminder=data.reminder,
        flagged=data.flagged,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(row)
    refresh_lead_aggregates(lead, db)
    db.commit()
    db.refresh(row)
    return serialize_task(row, db)


def update_task(lead_id: str, task_id: str, data: LeadTaskUpdate, current_user, db: Session, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = db.query(LeadTask).filter(LeadTask.id == safe_uuid(task_id), LeadTask.leadId == lead.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    payload = data.model_dump(exclude_unset=True)
    if "assignedToId" in payload:
        payload["assignedToId"] = uid(payload["assignedToId"])
    if payload.get("status") == "completed" and not row.completedAt:
        payload["completedAt"] = datetime.utcnow()
    for k, v in payload.items():
        setattr(row, k, v)
    row.updatedAt = datetime.utcnow()
    refresh_lead_aggregates(lead, db)
    db.commit()
    db.refresh(row)
    return serialize_task(row, db)


def complete_task(lead_id: str, task_id: str, current_user, db: Session, tenant_context):
    return update_task(lead_id, task_id, LeadTaskUpdate(status="completed"), current_user, db, tenant_context)


def push_task(lead_id: str, task_id: str, current_user, db: Session, tenant_context, hours: int = 24):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = db.query(LeadTask).filter(LeadTask.id == safe_uuid(task_id), LeadTask.leadId == lead.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    base = row.dueAt or datetime.utcnow()
    row.dueAt = base + timedelta(hours=hours)
    row.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return serialize_task(row, db)


def delete_task(lead_id: str, task_id: str, current_user, db: Session, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = db.query(LeadTask).filter(LeadTask.id == safe_uuid(task_id), LeadTask.leadId == lead.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(row)
    refresh_lead_aggregates(lead, db)
    db.commit()
    return {"message": "Task deleted"}
