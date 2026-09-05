from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from .....models.pos import PosProductCategory as PosProductCategoryORM


def get_pos_categories(db: Session, tenant_id: str) -> List[PosProductCategoryORM]:
    return (
        db.query(PosProductCategoryORM)
        .filter(PosProductCategoryORM.tenant_id == tenant_id)
        .order_by(PosProductCategoryORM.name)
        .all()
    )


def get_pos_category_by_id(
    category_id: str,
    db: Session,
    tenant_id: str,
) -> Optional[PosProductCategoryORM]:
    return (
        db.query(PosProductCategoryORM)
        .filter(
            PosProductCategoryORM.id == category_id,
            PosProductCategoryORM.tenant_id == tenant_id,
        )
        .first()
    )


def get_pos_category_by_name(
    name: str,
    db: Session,
    tenant_id: str,
) -> Optional[PosProductCategoryORM]:
    return (
        db.query(PosProductCategoryORM)
        .filter(
            PosProductCategoryORM.tenant_id == tenant_id,
            func.lower(PosProductCategoryORM.name) == name.strip().lower(),
        )
        .first()
    )


def create_pos_category(
    tenant_id: str,
    name: str,
    db: Session,
) -> PosProductCategoryORM:
    cat = PosProductCategoryORM(tenant_id=tenant_id, name=name.strip())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


def delete_pos_category(category_id: str, db: Session, tenant_id: str) -> bool:
    cat = get_pos_category_by_id(category_id, db, tenant_id)
    if cat:
        db.delete(cat)
        db.commit()
        return True
    return False


def list_pos_categories_endpoint(db: Session, tenant_context: dict):
    from fastapi import HTTPException
    from .....models.inventory_models import ProductCategory, WORKSHOP_CATEGORIES

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    plan_type = (tenant_context.get("plan_type") or "").lower()
    default = WORKSHOP_CATEGORIES if plan_type == "workshop" else [e.value for e in ProductCategory]
    custom_list = get_pos_categories(db, tenant_context["tenant_id"])
    custom_names = [c.name for c in custom_list]
    return {
        "categories": default + custom_names,
        "customCategories": [{"id": str(c.id), "name": c.name} for c in custom_list],
    }


def create_pos_category_endpoint(db: Session, tenant_context: dict, body: dict):
    from fastapi import HTTPException

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required")
    existing = get_pos_category_by_name(name, db, tenant_context["tenant_id"])
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    cat = create_pos_category(tenant_context["tenant_id"], name, db)
    return {"id": str(cat.id), "name": cat.name}


def delete_pos_category_endpoint(db: Session, tenant_context: dict, category_id: str):
    from fastapi import HTTPException

    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    success = delete_pos_category(category_id, db, tenant_context["tenant_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted"}
