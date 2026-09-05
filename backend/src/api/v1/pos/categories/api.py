from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from . import logic

router = APIRouter()


@router.get("/categories")
async def get_pos_categories_list(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:products:view")),
):
    return logic.list_pos_categories_endpoint(db, tenant_context)


@router.post("/categories")
async def create_pos_category_endpoint(
    body: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:products:create")),
):
    return logic.create_pos_category_endpoint(db, tenant_context, body)


@router.delete("/categories/{category_id}")
async def delete_pos_category_endpoint(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:products:delete")),
):
    return logic.delete_pos_category_endpoint(db, tenant_context, category_id)
