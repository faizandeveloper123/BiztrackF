import uuid
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ......models.crm.lead_related import LeadSavedFilter
from ...http_common import require_tenant, safe_uuid
from ..schemas import LeadSavedFilterCreate
from .helpers import uid


def list_saved_filters(db: Session, current_user, tenant_context):
    ctx = require_tenant(tenant_context)
    rows = (
        db.query(LeadSavedFilter)
        .filter(LeadSavedFilter.tenant_id == safe_uuid(ctx["tenant_id"]))
        .order_by(LeadSavedFilter.pinOrder.asc())
        .all()
    )
    return [
        {
            "id": r.id,
            "name": r.name,
            "filters": r.filters or {},
            "pinned": bool(r.pinned),
            "pinOrder": r.pinOrder or 0,
            "color": r.color,
        }
        for r in rows
    ]


def create_saved_filter(data: LeadSavedFilterCreate, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    row = LeadSavedFilter(
        id=uuid.uuid4(),
        tenant_id=safe_uuid(ctx["tenant_id"]),
        userId=uid(current_user.id),
        name=data.name,
        filters=data.filters or {},
        pinned=data.pinned,
        pinOrder=data.pinOrder,
        color=data.color,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "name": row.name,
        "filters": row.filters or {},
        "pinned": bool(row.pinned),
        "pinOrder": row.pinOrder or 0,
        "color": row.color,
    }


def delete_saved_filter(filter_id: str, current_user, db: Session, tenant_context):
    ctx = require_tenant(tenant_context)
    row = db.query(LeadSavedFilter).filter(
        LeadSavedFilter.id == safe_uuid(filter_id),
        LeadSavedFilter.tenant_id == safe_uuid(ctx["tenant_id"]),
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Filter not found")
    db.delete(row)
    db.commit()
    return {"message": "Filter deleted"}


def ensure_default_pinned_filters(db: Session, tenant_context, current_user):
    existing = list_saved_filters(db, current_user, tenant_context)
    if existing:
        return existing
    defaults = [
        ("1st Priority", {"priority": "urgent"}, "#3b82f6", 1),
        ("2nd Priority", {"priority": "high"}, "#6366f1", 2),
        ("3rd Priority", {"priority": "medium"}, "#60a5fa", 3),
        ("Hot Leads", {"leadRating": "hot"}, "#fb923c", 4),
        ("Warm Leads", {"leadRating": "warm"}, "#fbbf24", 5),
        ("Cold Leads", {"leadRating": "cold"}, "#9ca3af", 6),
    ]
    for name, filters, color, order in defaults:
        create_saved_filter(
            LeadSavedFilterCreate(name=name, filters=filters, pinned=True, pinOrder=order, color=color),
            current_user,
            db,
            tenant_context,
        )
    return list_saved_filters(db, current_user, tenant_context)
