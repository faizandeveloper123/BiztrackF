from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from .schemas import Opportunity, OpportunityCreate, OpportunityUpdate, CRMOpportunitiesResponse
from . import logic

router = APIRouter()


@router.get("/opportunities", response_model=CRMOpportunitiesResponse)
async def get_crm_opportunities(
    stage: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_opportunities(db, current_user, tenant_context, stage, assigned_to, search, page, limit)


@router.post("/opportunities", response_model=Opportunity)
async def create_crm_opportunity(
    opportunity_data: OpportunityCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return logic.create_crm_opportunity(opportunity_data, current_user, db, tenant_context)


@router.get("/opportunities/{opportunity_id}", response_model=Opportunity)
async def get_crm_opportunity(
    opportunity_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_opportunity(opportunity_id, db, current_user, tenant_context)


@router.put("/opportunities/{opportunity_id}", response_model=Opportunity)
async def update_crm_opportunity(
    opportunity_id: str,
    opportunity_data: OpportunityUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.update_crm_opportunity(opportunity_id, opportunity_data, current_user, db, tenant_context)


@router.delete("/opportunities/{opportunity_id}")
async def delete_crm_opportunity(
    opportunity_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return logic.delete_crm_opportunity(opportunity_id, current_user, db, tenant_context)
