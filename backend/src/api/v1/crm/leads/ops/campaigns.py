import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ......models.crm import Lead
from ......models.crm.lead_related import LeadCampaign, LeadCampaignAssignment
from ...http_common import require_tenant, safe_uuid
from ..schemas import LeadCampaignCreate, LeadCampaignAssign, LeadEmailCompose, LeadSmsSend
from .helpers import uid, user_name, get_lead_or_404, email_service
from .emails import compose_email
from .sms import send_sms


def list_campaigns(db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    rows = db.query(LeadCampaign).filter(LeadCampaign.tenant_id == safe_uuid(ctx["tenant_id"])).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "steps": r.steps or [],
            "status": r.status,
            "createdAt": r.createdAt,
        }
        for r in rows
    ]


def create_campaign(data: LeadCampaignCreate, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    row = LeadCampaign(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        name=data.name,
        description=data.description,
        steps=data.steps or [],
        status="active",
        createdById=uid(current_user.id),
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "name": row.name,
        "description": row.description,
        "steps": row.steps or [],
        "status": row.status,
        "createdAt": row.createdAt,
    }


def list_campaign_assignments(lead_id: str, db: Session, current_user, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    rows = db.query(LeadCampaignAssignment).filter(LeadCampaignAssignment.leadId == lead.id).all()
    out = []
    for r in rows:
        camp = db.query(LeadCampaign).filter(LeadCampaign.id == r.campaignId).first()
        out.append(
            {
                "id": r.id,
                "leadId": r.leadId,
                "campaignId": r.campaignId,
                "campaignName": camp.name if camp else None,
                "status": r.status,
                "progress": r.progress or 0,
                "currentStep": r.currentStep or 0,
                "totalSteps": r.totalSteps or 0,
                "assignedById": str(r.assignedById) if r.assignedById else None,
                "assignedByName": user_name(db, r.assignedById),
                "assignedAt": r.assignedAt,
            }
        )
    return out


def assign_campaign(lead_id: str, data: LeadCampaignAssign, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    camp = db.query(LeadCampaign).filter(
        LeadCampaign.id == safe_uuid(data.campaignId),
        LeadCampaign.tenant_id == safe_uuid(ctx["tenant_id"]),
    ).first()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
    steps = camp.steps or []
    row = LeadCampaignAssignment(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        leadId=lead.id,
        campaignId=camp.id,
        status="in_progress",
        progress=0,
        currentStep=0,
        totalSteps=len(steps) or 1,
        assignedById=uid(current_user.id),
        assignedAt=datetime.utcnow(),
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "leadId": row.leadId,
        "campaignId": row.campaignId,
        "campaignName": camp.name,
        "status": row.status,
        "progress": row.progress,
        "currentStep": row.currentStep,
        "totalSteps": row.totalSteps,
        "assignedById": str(row.assignedById) if row.assignedById else None,
        "assignedByName": user_name(db, row.assignedById),
        "assignedAt": row.assignedAt,
    }


def _run_campaign_step(lead, camp, assignment, current_user, db, tenant_context):
    steps = (camp.steps if camp else None) or []
    idx = max((assignment.currentStep or 1) - 1, 0)
    if idx >= len(steps):
        return
    step = steps[idx]
    step_type = (step.get("type") or "email").lower()
    content = step.get("body") or step.get("content") or f"Campaign update for {lead.firstName}"
    subject = step.get("subject") or f"{camp.name if camp else 'Campaign'} update"
    if step_type == "sms" and (lead.phone or lead.workPhone):
        send_sms(str(lead.id), LeadSmsSend(body=content), current_user, db, tenant_context)
    else:
        compose_email(str(lead.id), LeadEmailCompose(subject=subject, body=content), current_user, db, tenant_context)


def campaign_action(lead_id: str, assignment_id: str, action: str, current_user, db: Session, tenant_context):
    lead = get_lead_or_404(lead_id, db, current_user, tenant_context)
    row = db.query(LeadCampaignAssignment).filter(
        LeadCampaignAssignment.id == safe_uuid(assignment_id),
        LeadCampaignAssignment.leadId == lead.id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Assignment not found")
    camp = db.query(LeadCampaign).filter(LeadCampaign.id == row.campaignId).first()
    if action == "stop":
        row.status = "stopped"
        row.stoppedAt = datetime.utcnow()
    elif action == "start":
        row.status = "in_progress"
        row.stoppedAt = None
    elif action == "force":
        row.currentStep = min((row.currentStep or 0) + 1, row.totalSteps or 1)
        total = row.totalSteps or 1
        row.progress = int((row.currentStep / total) * 100)
        if row.currentStep >= total:
            row.status = "completed"
            row.progress = 100
        else:
            _run_campaign_step(lead, camp, row, current_user, db, tenant_context)
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    row.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "leadId": row.leadId,
        "campaignId": row.campaignId,
        "campaignName": camp.name if camp else None,
        "status": row.status,
        "progress": row.progress,
        "currentStep": row.currentStep,
        "totalSteps": row.totalSteps,
        "assignedById": str(row.assignedById) if row.assignedById else None,
        "assignedByName": user_name(db, row.assignedById),
        "assignedAt": row.assignedAt,
    }


def process_due_campaigns(db: Session):
    rows = (
        db.query(LeadCampaignAssignment)
        .filter(LeadCampaignAssignment.status == "in_progress")
        .all()
    )
    processed = 0
    for assignment in rows:
        camp = db.query(LeadCampaign).filter(LeadCampaign.id == assignment.campaignId).first()
        lead = db.query(Lead).filter(Lead.id == assignment.leadId).first()
        if not camp or not lead:
            continue
        steps = camp.steps or []
        if not steps:
            continue
        assignment.currentStep = min((assignment.currentStep or 0) + 1, len(steps))
        assignment.progress = int((assignment.currentStep / max(len(steps), 1)) * 100)
        idx = assignment.currentStep - 1
        if 0 <= idx < len(steps):
            step = steps[idx]
            content = step.get("body") or f"Campaign: {camp.name}"
            subject = step.get("subject") or camp.name
            email_service.send_lead_email(lead.email, subject, content, content)
        if assignment.currentStep >= len(steps):
            assignment.status = "completed"
            assignment.progress = 100
        assignment.updatedAt = datetime.utcnow()
        processed += 1
    db.commit()
    return {"processed": processed}
