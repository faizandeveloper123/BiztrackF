from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from .schemas import SalesActivity, SalesActivityCreate, SalesActivityUpdate, CRMActivitiesResponse
from . import logic

router = APIRouter()


@router.get("/activities", response_model=CRMActivitiesResponse)
async def get_crm_activities(
    type: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_activities(db, current_user, tenant_context, type, completed, search, page, limit)


@router.post("/activities", response_model=SalesActivity)
async def create_crm_activity(
    activity_data: SalesActivityCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return logic.create_crm_activity(activity_data, current_user, db, tenant_context)


@router.get("/activities/{activity_id}", response_model=SalesActivity)
async def get_crm_activity(
    activity_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_activity(activity_id, db, current_user, tenant_context)


@router.put("/activities/{activity_id}", response_model=SalesActivity)
async def update_crm_activity(
    activity_id: str,
    activity_data: SalesActivityUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.update_crm_activity(activity_id, activity_data, current_user, db, tenant_context)


@router.delete("/activities/{activity_id}")
async def delete_crm_activity(
    activity_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return logic.delete_crm_activity(activity_id, current_user, db, tenant_context)
