import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from .....models.crm import SalesActivity as SalesActivityORM
from ..http_common import (
    apply_scoped_filters,
    delete_message,
    pagination,
    require_tenant,
    safe_uuid,
    tenant_id_optional,
    visible_or_404,
)
from ...repository import create_entity, delete_by_id, get_by_id, list_for_tenant, update_entity
from .schemas import SalesActivity, SalesActivityCreate, SalesActivityUpdate, CRMActivitiesResponse

ACTIVITY_NULLABLE = frozenset({"completedAt", "description", "notes", "status"})


def get_sales_activity_by_id(activity_id: str, db: Session, tenant_id: str = None) -> Optional[SalesActivityORM]:
    return get_by_id(SalesActivityORM, activity_id, db, tenant_id)


def _get_all_sales_activities(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[SalesActivityORM]:
    return list_for_tenant(SalesActivityORM, db, tenant_id, skip, limit)


get_sales_activities = _get_all_sales_activities
get_all_sales_activities = _get_all_sales_activities


def get_sales_activities_by_assignee(
    assignee_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100
) -> List[SalesActivityORM]:
    return list_for_tenant(
        SalesActivityORM, db, tenant_id, skip, limit,
        order_by=SalesActivityORM.dueDate.asc(),
        filters=[SalesActivityORM.assignedToId == assignee_id],
    )


def _create_sales_activity(activity_data: dict, db: Session) -> SalesActivityORM:
    return create_entity(SalesActivityORM, activity_data, db)


def update_sales_activity(activity_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[SalesActivityORM]:
    activity = get_sales_activity_by_id(activity_id, db, tenant_id)
    if not activity:
        return None
    return update_entity(activity, update_data, db, nullable_keys=ACTIVITY_NULLABLE)


def delete_sales_activity(activity_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(SalesActivityORM, activity_id, db, tenant_id)


def _activity_predicate(type_, completed, search):
    def _match(activity: SalesActivityORM) -> bool:
        if type_ and activity.type != type_:
            return False
        if completed is not None:
            is_done = activity.status == "completed" or activity.completedAt is not None
            if completed != is_done:
                return False
        if search:
            sl = search.lower()
            if not any(sl in (getattr(activity, f, None) or "").lower() for f in ("subject", "description")):
                return False
        return True

    return _match


def get_crm_activities(
    db: Session,
    current_user,
    tenant_context: Optional[dict],
    type: Optional[str] = None,
    completed: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    try:
        skip = (page - 1) * limit
        tid = tenant_id_optional(tenant_context)
        activities = get_sales_activities(db, tid, skip, limit)
        activities = apply_scoped_filters(
            activities, tenant_context, current_user, _activity_predicate(type, completed, search)
        )
        total = len(activities)
        return CRMActivitiesResponse(activities=activities, pagination=pagination(page, limit, total))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activities: {str(e)}")


def create_crm_activity(activity_data: SalesActivityCreate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        ctx = require_tenant(tenant_context)
        d = activity_data.dict()
        rel_type, rel_id = None, None
        for key, rt in (("leadId", "lead"), ("opportunityId", "opportunity"), ("contactId", "contact"), ("companyId", "company")):
            if d.get(key):
                rel_type, rel_id = rt, d[key]
                break
        due = None
        if d.get("dueDate"):
            try:
                due = datetime.fromisoformat(str(d["dueDate"]).replace("Z", "+00:00"))
            except Exception:
                pass
        typ = d["type"]
        typ_s = typ.value if hasattr(typ, "value") else str(typ)
        uid = safe_uuid(current_user.id)
        tenant_u = safe_uuid(ctx["tenant_id"])
        if not tenant_u or not uid:
            raise HTTPException(status_code=400, detail="Invalid tenant or user")
        activity_dict = {
            "id": uuid.uuid4(),
            "tenant_id": tenant_u,
            "type": typ_s,
            "subject": d["subject"],
            "description": d.get("description"),
            "relatedToType": rel_type,
            "relatedToId": safe_uuid(rel_id),
            "assignedToId": uid,
            "createdById": uid,
            "dueDate": due,
            "completedAt": datetime.utcnow() if d.get("completed") else None,
            "status": "completed" if d.get("completed") else "pending",
            "priority": "medium",
            "notes": d.get("notes"),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        return SalesActivity.model_validate(_create_sales_activity(activity_dict, db))
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating activity: {str(e)}")


def get_crm_activity(activity_id: str, db: Session, current_user, tenant_context: Optional[dict] = None):
    try:
        activity = get_sales_activity_by_id(activity_id, db, tenant_id_optional(tenant_context))
        return SalesActivity.model_validate(
            visible_or_404(activity, tenant_context, current_user, detail="Activity not found")
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching activity: {str(e)}")


def update_crm_activity(activity_id: str, activity_data: SalesActivityUpdate, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        tid = tenant_id_optional(tenant_context)
        visible_or_404(get_sales_activity_by_id(activity_id, db, tid), tenant_context, current_user, detail="Activity not found")
        update_data = activity_data.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        if "completed" in update_data:
            c = update_data.pop("completed")
            if c:
                update_data["status"] = "completed"
                update_data["completedAt"] = datetime.utcnow()
            else:
                update_data["status"] = "pending"
                update_data["completedAt"] = None
        updated = update_sales_activity(activity_id, update_data, db, tid)
        try:
            from .....services.crm_sync_service import sync_on_activity_completed
            sync_on_activity_completed(db, updated)
            db.commit()
        except Exception:
            pass
        return SalesActivity.model_validate(updated)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating activity: {str(e)}")


def delete_crm_activity(activity_id: str, current_user, db: Session, tenant_context: Optional[dict] = None):
    try:
        tid = tenant_id_optional(tenant_context)
        visible_or_404(get_sales_activity_by_id(activity_id, db, tid), tenant_context, current_user, detail="Activity not found")
        if not delete_sales_activity(activity_id, db, tid):
            raise HTTPException(status_code=404, detail="Activity not found")
        return delete_message("Activity")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting activity: {str(e)}")


create_sales_activity = _create_sales_activity
