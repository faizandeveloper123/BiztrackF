import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....models.crm import Lead
from ..contacts.logic import create_contact
from ..http_common import (
    apply_scoped_filters,
    delete_message,
    notify_assignee,
    notify_crm_broadcast,
    pagination,
    require_tenant,
    safe_uuid,
    tenant_id_optional,
    user_display_name,
    visible_or_404,
)
from ...repository import create_entity, delete_by_id, get_by_id, list_for_tenant, update_entity
from ..shared import _contact_create_to_orm_dict
from ..contacts.schemas import ContactCreate
from .schemas import Lead as LeadSchema, LeadCreate, LeadUpdate, CRMLeadsResponse, BulkLeadAction
from . import ops as related_ops

ORM_KEYS = frozenset({
    "id", "tenant_id", "firstName", "lastName", "email", "phone", "company", "jobTitle",
    "leadSource", "status", "priority", "assignedToId", "createdById", "notes", "tags",
    "createdAt", "updatedAt",
    "pipelineStage", "leadRating", "leadType", "priceMin", "priceMax", "buyIntent", "sellIntent",
    "houseToSell", "buyingIn", "sellingIn", "mortgageType", "ownsRents",
    "workPhone", "homePhone", "address", "city", "description", "ipAddress", "lat", "lng",
    "mainAgentId", "listAgentId", "mortgageAgentId",
    "score", "budget", "timeline", "estimatedValue", "expectedCloseDate",
    "lastContactAt", "lastContactChannel", "registeredAt", "isPartial",
    "refSource", "campaignSource", "receiveSms", "customFields", "nextFollowUpDate",
    "callCount", "emailCount", "smsCount", "lastCallAt", "lastEmailAt", "lastSmsAt",
    "hasOpenTask", "hasFlaggedTask",
})

AGENT_KEYS = ("mainAgentId", "listAgentId", "mortgageAgentId")

STATUS_TO_PIPELINE = related_ops.STATUS_TO_PIPELINE


def get_lead_by_id(lead_id: str, db: Session, tenant_id: str = None) -> Optional[Lead]:
    return get_by_id(Lead, lead_id, db, tenant_id)


def _get_all_leads(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Lead]:
    return list_for_tenant(Lead, db, tenant_id, skip, limit)


get_leads = _get_all_leads
get_all_leads = _get_all_leads


def get_leads_by_status(status: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Lead]:
    return list_for_tenant(Lead, db, tenant_id, skip, limit, filters=[Lead.status == status])


def get_leads_by_assignee(assignee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Lead]:
    return list_for_tenant(Lead, db, tenant_id, skip, limit, filters=[Lead.assignedToId == assignee_id])


def create_lead(lead_data: dict, db: Session) -> Lead:
    return create_entity(Lead, lead_data, db)


def update_lead(lead_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Lead]:
    lead = get_lead_by_id(lead_id, db, tenant_id)
    if not lead:
        return None
    filtered = {
        k: v
        for k, v in update_data.items()
        if v is not None
        or k
        in (
            "tags",
            "customFields",
            "receiveSms",
            "isPartial",
            "assignedToId",
            "mainAgentId",
            "listAgentId",
            "mortgageAgentId",
            "leadRating",
            "priceMin",
            "priceMax",
            "description",
            "address",
            "phone",
            "workPhone",
            "homePhone",
        )
    }
    return update_entity(lead, filtered, db)


def delete_lead(lead_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(Lead, lead_id, db, tenant_id)


def _normalize_create_dict(lead_dict: dict) -> dict:
    if lead_dict.get("assignedTo"):
        lead_dict["assignedToId"] = safe_uuid(lead_dict.pop("assignedTo"))
    elif "assignedTo" in lead_dict:
        lead_dict.pop("assignedTo", None)
    for key in AGENT_KEYS:
        if lead_dict.get(key):
            lead_dict[key] = safe_uuid(lead_dict[key])
    if lead_dict.get("mainAgentId") and not lead_dict.get("assignedToId"):
        lead_dict["assignedToId"] = lead_dict["mainAgentId"]
    if lead_dict.get("assignedToId") and not lead_dict.get("mainAgentId"):
        lead_dict["mainAgentId"] = lead_dict["assignedToId"]
    if not lead_dict.get("pipelineStage") and lead_dict.get("status"):
        lead_dict["pipelineStage"] = STATUS_TO_PIPELINE.get(str(lead_dict["status"]), "new_lead")
    if not lead_dict.get("status"):
        lead_dict["status"] = "open"
    if not lead_dict.get("registeredAt"):
        lead_dict["registeredAt"] = datetime.utcnow()
    if lead_dict.get("expectedCloseDate") and isinstance(lead_dict["expectedCloseDate"], str):
        try:
            lead_dict["expectedCloseDate"] = datetime.fromisoformat(lead_dict["expectedCloseDate"].replace("Z", ""))
        except Exception:
            lead_dict["expectedCloseDate"] = None
    return {k: v for k, v in lead_dict.items() if k in ORM_KEYS}


def _lead_predicate(
    status=None,
    source=None,
    assigned_to=None,
    search=None,
    pipeline=None,
    rating=None,
    priority=None,
    is_partial=None,
    lead_type=None,
):
    def _match(lead: Lead) -> bool:
        if status and lead.status != status:
            return False
        if source and (lead.leadSource or "") != source:
            return False
        if assigned_to and str(lead.assignedToId or "") != str(assigned_to):
            return False
        if pipeline and (lead.pipelineStage or "") != pipeline:
            return False
        if rating and (lead.leadRating or "") != rating:
            return False
        if priority and (lead.priority or "") != priority:
            return False
        if is_partial is not None and bool(lead.isPartial) != bool(is_partial):
            return False
        if lead_type and (lead.leadType or "") != lead_type:
            return False
        if search:
            sl = search.lower()
            if not any(
                sl in (getattr(lead, f, None) or "").lower()
                for f in ("firstName", "lastName", "email", "company", "phone", "city", "campaignSource")
            ):
                return False
        return True

    return _match


def get_crm_leads(
    db: Session,
    current_user,
    tenant_context: Optional[dict],
    status: Optional[str] = None,
    source: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    pipeline: Optional[str] = None,
    rating: Optional[str] = None,
    priority: Optional[str] = None,
    is_partial: Optional[bool] = None,
    lead_type: Optional[str] = None,
    sort: Optional[str] = None,
):
    try:
        tid = tenant_id_optional(tenant_context)
        leads = get_leads(db, tid, 0, 100000)
        leads = apply_scoped_filters(
            leads,
            tenant_context,
            current_user,
            _lead_predicate(status, source, assigned_to, search, pipeline, rating, priority, is_partial, lead_type),
        )
        reverse = sort != "oldest"
        leads = sorted(leads, key=lambda l: l.createdAt or datetime.min, reverse=reverse)
        total = len(leads)
        skip = (page - 1) * limit
        page_rows = leads[skip : skip + limit]
        serialized = [LeadSchema.model_validate(lead) for lead in page_rows]
        return CRMLeadsResponse(leads=serialized, pagination=pagination(page, limit, total))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leads: {str(e)}")


def create_crm_lead(lead_data: LeadCreate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        lead_dict = {
            **lead_data.model_dump(),
            "tenant_id": ctx["tenant_id"],
            "id": uuid.uuid4(),
            "createdById": safe_uuid(current_user.id),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        lead_dict = _normalize_create_dict(lead_dict)
        lead = create_lead(lead_dict, db)
        related_ops.record_pipeline_history(
            db, lead, lead.pipelineStage or "new_lead", current_user.id, ctx["tenant_id"]
        )
        db.commit()
        db.refresh(lead)
        name = f"{lead_data.firstName} {lead_data.lastName}".strip() or "Lead"
        notify_crm_broadcast(
            db, ctx, current_user,
            title="New Lead Created",
            message=f"{user_display_name(current_user)} created a new lead: {name}",
            path=f"/crm/leads/{lead.id}",
            meta={"lead_id": str(lead.id), "created_by": str(current_user.id)},
        )
        notify_assignee(db, ctx, current_user, lead, entity_label="Lead", entity_name=name, path=f"/crm/leads/{lead.id}")
        return LeadSchema.model_validate(lead)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating lead: {str(e)}")


def get_crm_lead(lead_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    try:
        lead = get_lead_by_id(lead_id, db, tenant_id_optional(tenant_context))
        lead = visible_or_404(lead, tenant_context, current_user, detail="Lead not found")
        return LeadSchema.model_validate(lead)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lead: {str(e)}")


def get_crm_lead_detail(lead_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    try:
        lead = related_ops.get_lead_or_404(lead_id, db, current_user, tenant_context)
        return related_ops.build_lead_detail(lead, db)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching lead detail: {str(e)}")


def update_crm_lead(lead_id: str, lead_data: LeadUpdate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        tid = tenant_id_optional(tenant_context)
        lead = visible_or_404(get_lead_by_id(lead_id, db, tid), tenant_context, current_user, detail="Lead not found")
        update_data = lead_data.model_dump(exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        if "assignedTo" in update_data:
            update_data["assignedToId"] = safe_uuid(update_data.pop("assignedTo")) if update_data.get("assignedTo") else None
            if update_data.get("assignedToId") and "mainAgentId" not in update_data:
                update_data["mainAgentId"] = update_data["assignedToId"]
        if "mainAgentId" in update_data:
            update_data["mainAgentId"] = safe_uuid(update_data["mainAgentId"]) if update_data["mainAgentId"] else None
            if update_data.get("mainAgentId"):
                update_data["assignedToId"] = update_data["mainAgentId"]
        for key in ("listAgentId", "mortgageAgentId"):
            if key in update_data and update_data[key]:
                update_data[key] = safe_uuid(update_data[key])
        if update_data.get("expectedCloseDate") and isinstance(update_data["expectedCloseDate"], str):
            try:
                update_data["expectedCloseDate"] = datetime.fromisoformat(
                    update_data["expectedCloseDate"].replace("Z", "")
                )
            except Exception:
                update_data.pop("expectedCloseDate", None)
        old_stage = lead.pipelineStage
        if "pipelineStage" in update_data and update_data["pipelineStage"] and update_data["pipelineStage"] != old_stage:
            related_ops.record_pipeline_history(
                db, lead, update_data["pipelineStage"], current_user.id, ctx["tenant_id"]
            )
        update_data = {k: v for k, v in update_data.items() if k in ORM_KEYS or k == "updatedAt"}
        updated = update_lead(lead_id, update_data, db, tid)
        try:
            from .....services.crm_sync_service import sync_on_lead_status_change
            new_status = update_data.get("status") or getattr(updated, "status", None)
            if new_status:
                sync_on_lead_status_change(db, updated, str(new_status))
                db.commit()
        except Exception:
            pass
        name = f"{getattr(updated, 'firstName', '')} {getattr(updated, 'lastName', '')}".strip() or "Lead"
        notify_crm_broadcast(
            db, ctx, current_user,
            title="Lead Updated",
            message=f"{user_display_name(current_user)} updated lead: {name}",
            path=f"/crm/leads/{lead_id}",
            meta={"lead_id": lead_id, "updated_by": str(current_user.id)},
        )
        notify_assignee(db, ctx, current_user, updated, entity_label="Lead", entity_name=name, path=f"/crm/leads/{lead_id}")
        return LeadSchema.model_validate(updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating lead: {str(e)}")


def delete_crm_lead(lead_id: str, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        tid = tenant_id_optional(tenant_context)
        visible_or_404(get_lead_by_id(lead_id, db, tid), tenant_context, current_user, detail="Lead not found")
        if not delete_lead(lead_id, db, tid):
            raise HTTPException(status_code=404, detail="Lead not found")
        return delete_message("Lead")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting lead: {str(e)}")


def bulk_lead_action(data: BulkLeadAction, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        tid = tenant_id_optional(tenant_context)
        updated = 0
        for lid in data.leadIds:
            lead = get_lead_by_id(lid, db, tid)
            if not lead:
                continue
            try:
                visible_or_404(lead, tenant_context, current_user, detail="Lead not found")
            except HTTPException:
                continue
            if data.action == "delete":
                delete_lead(lid, db, tid)
                updated += 1
                continue
            patch = {"updatedAt": datetime.utcnow()}
            if data.action == "assign" and data.assignedTo:
                patch["assignedToId"] = safe_uuid(data.assignedTo)
                patch["mainAgentId"] = safe_uuid(data.assignedTo)
            if data.action == "pipeline" and data.pipelineStage:
                related_ops.record_pipeline_history(db, lead, data.pipelineStage, current_user.id, ctx["tenant_id"])
                patch["pipelineStage"] = data.pipelineStage
            if data.action == "status" and data.status:
                patch["status"] = data.status
            if data.action == "rating" and data.leadRating:
                patch["leadRating"] = data.leadRating
            if data.action == "priority" and data.priority:
                patch["priority"] = data.priority
            if data.action == "tag" and data.tags:
                existing = list(lead.tags or [])
                for t in data.tags:
                    if t not in existing:
                        existing.append(t)
                patch["tags"] = existing
            update_lead(lid, patch, db, tid)
            updated += 1
        return {"message": f"Updated {updated} leads", "updated": updated}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error in bulk action: {str(e)}")


def convert_lead_to_contact(
    lead_id: str,
    contact_data: ContactCreate,
    current_user,
    db: Session,
    tenant_context: Optional[dict] = None,
):
    try:
        ctx = require_tenant(tenant_context)
        tid = str(ctx["tenant_id"])
        lead = visible_or_404(get_lead_by_id(lead_id, db, tid), tenant_context, current_user, detail="Lead not found")
        contact = create_contact(
            _contact_create_to_orm_dict(contact_data, tid, str(current_user.id)),
            db,
        )
        lead.status = "converted"
        lead.pipelineStage = "closed"
        lead.updatedAt = datetime.utcnow()
        related_ops.record_pipeline_history(db, lead, "closed", current_user.id, ctx["tenant_id"])
        db.commit()
        db.refresh(contact)
        db.refresh(lead)
        return {"message": "Lead converted successfully", "contact": contact}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error converting lead: {str(e)}")
