import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....models.crm import Opportunity as OpportunityORM
from ..http_common import (
    apply_scoped_filters,
    delete_message,
    notify_assignee,
    pagination,
    require_tenant,
    safe_uuid,
    tenant_id_optional,
    user_display_name,
    visible_or_404,
)
from ...repository import create_entity, delete_by_id, get_by_id, list_for_tenant, update_entity
from .schemas import Opportunity, OpportunityCreate, OpportunityUpdate, CRMOpportunitiesResponse


def get_opportunity_by_id(opportunity_id: str, db: Session, tenant_id: str = None) -> Optional[OpportunityORM]:
    return get_by_id(OpportunityORM, opportunity_id, db, tenant_id)


def _get_all_opportunities(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[OpportunityORM]:
    return list_for_tenant(OpportunityORM, db, tenant_id, skip, limit)


get_opportunities = _get_all_opportunities
get_all_opportunities = _get_all_opportunities


def get_opportunities_by_stage(stage: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[OpportunityORM]:
    return list_for_tenant(OpportunityORM, db, tenant_id, skip, limit, filters=[OpportunityORM.stage == stage])


def get_opportunities_by_assignee(assignee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[OpportunityORM]:
    return list_for_tenant(OpportunityORM, db, tenant_id, skip, limit, filters=[OpportunityORM.assignedToId == assignee_id])


def _create_opportunity(opportunity_data: dict, db: Session) -> OpportunityORM:
    return create_entity(OpportunityORM, opportunity_data, db)


def _update_opportunity(opportunity_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[OpportunityORM]:
    opp = get_opportunity_by_id(opportunity_id, db, tenant_id)
    if not opp:
        return None
    filtered = {k: v for k, v in update_data.items() if v is not None}
    return update_entity(opp, filtered, db)


def delete_opportunity(opportunity_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(OpportunityORM, opportunity_id, db, tenant_id)


def _parse_close_date(value: Optional[str]):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        try:
            return datetime.strptime(value, "%Y-%m-%d")
        except Exception:
            return None


def _opp_predicate(stage, assigned_to, search):
    def _match(opp: OpportunityORM) -> bool:
        if stage and opp.stage != stage:
            return False
        if assigned_to and str(opp.assignedToId or "") != str(assigned_to):
            return False
        if search:
            sl = search.lower()
            if not any(sl in (getattr(opp, f, None) or "").lower() for f in ("name", "description")):
                return False
        return True

    return _match


def get_crm_opportunities(
    db: Session,
    current_user,
    tenant_context: Optional[dict],
    stage: Optional[str] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    try:
        skip = (page - 1) * limit
        tid = tenant_id_optional(tenant_context)
        opportunities = get_opportunities(db, tid, skip, limit)
        opportunities = apply_scoped_filters(
            opportunities, tenant_context, current_user, _opp_predicate(stage, assigned_to, search)
        )
        total = len(opportunities)
        return CRMOpportunitiesResponse(opportunities=opportunities, pagination=pagination(page, limit, total))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching opportunities: {str(e)}")


def create_crm_opportunity(opportunity_data: OpportunityCreate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        data = opportunity_data.dict()
        title = (data.get("title") or "").strip()
        if not title:
            raise HTTPException(status_code=422, detail="Title is required")
        company_id_raw = (data.get("companyId") and str(data["companyId"]).strip()) or None
        company_uuid = safe_uuid(company_id_raw) if company_id_raw else None
        if company_id_raw and company_uuid is None:
            raise HTTPException(status_code=400, detail="companyId must be a valid UUID")
        tenant_uuid = safe_uuid(ctx["tenant_id"]) or uuid.uuid4()
        opportunity = OpportunityORM(
            id=uuid.uuid4(),
            name=title,
            description=data.get("description"),
            stage=data.get("stage", "prospecting"),
            amount=data.get("amount"),
            probability=data.get("probability", 50),
            expectedCloseDate=_parse_close_date(data.get("expectedCloseDate")),
            companyId=company_uuid,
            contactId=safe_uuid(data.get("contactId")),
            assignedToId=safe_uuid(data.get("assignedTo")),
            createdById=safe_uuid(current_user.id),
            notes=data.get("notes"),
            tenant_id=tenant_uuid,
            tags=data.get("tags", []),
            leadSource=data.get("leadSource", "website"),
            createdAt=datetime.now(),
            updatedAt=datetime.now(),
        )
        db.add(opportunity)
        db.commit()
        db.refresh(opportunity)
        notify_assignee(
            db, ctx, current_user, opportunity,
            entity_label="Opportunity",
            entity_name=getattr(opportunity, "name", title),
            path=f"/crm/opportunities/{opportunity.id}",
        )
        return Opportunity.model_validate(opportunity)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating opportunity: {str(e)}")


def get_crm_opportunity(opportunity_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    try:
        opp = get_opportunity_by_id(opportunity_id, db, tenant_id_optional(tenant_context))
        return Opportunity.model_validate(
            visible_or_404(opp, tenant_context, current_user, detail="Opportunity not found")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching opportunity: {str(e)}")


def update_crm_opportunity(opportunity_id: str, opportunity_data: OpportunityUpdate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        tid = tenant_id_optional(tenant_context)
        opportunity = visible_or_404(
            get_opportunity_by_id(opportunity_id, db, tid), tenant_context, current_user, detail="Opportunity not found"
        )
        data = opportunity_data.dict(exclude_unset=True)
        if "title" in data:
            title = str(data["title"]).strip()
            if not title:
                raise HTTPException(status_code=422, detail="Title is required")
            opportunity.name = title
        field_map = {
            "description": "description",
            "stage": "stage",
            "amount": "amount",
            "probability": "probability",
            "notes": "notes",
            "wonAmount": "wonAmount",
            "lostReason": "lostReason",
            "tags": "tags",
            "leadSource": "leadSource",
        }
        for src, attr in field_map.items():
            if src in data:
                setattr(opportunity, attr, data[src])
        if "expectedCloseDate" in data:
            opportunity.expectedCloseDate = _parse_close_date(data["expectedCloseDate"])
        if "companyId" in data:
            u = safe_uuid(data["companyId"])
            if u is not None:
                opportunity.companyId = u
        if "contactId" in data:
            opportunity.contactId = safe_uuid(data["contactId"])
        if "assignedTo" in data:
            opportunity.assignedToId = safe_uuid(data["assignedTo"])
        if "closedDate" in data:
            opportunity.closedDate = _parse_close_date(data["closedDate"]) if data["closedDate"] else None
        opportunity.updatedAt = datetime.now()
        db.commit()
        db.refresh(opportunity)
        try:
            from .....services.crm_sync_service import sync_on_opportunity_closed
            sync_on_opportunity_closed(db, opportunity)
            db.commit()
            db.refresh(opportunity)
        except Exception:
            pass
        notify_assignee(
            db, ctx, current_user, opportunity,
            entity_label="Opportunity",
            entity_name=getattr(opportunity, "name", "Opportunity"),
            path=f"/crm/opportunities/{opportunity_id}",
        )
        return Opportunity.model_validate(opportunity)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating opportunity: {str(e)}")


def delete_crm_opportunity(opportunity_id: str, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        tid = tenant_id_optional(tenant_context)
        visible_or_404(
            get_opportunity_by_id(opportunity_id, db, tid), tenant_context, current_user, detail="Opportunity not found"
        )
        if not delete_opportunity(opportunity_id, db, tid):
            raise HTTPException(status_code=404, detail="Opportunity not found")
        return delete_message("Opportunity")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting opportunity: {str(e)}")


create_opportunity = _create_opportunity
update_opportunity = _update_opportunity
