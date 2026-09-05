from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from .schemas import Company, CompanyCreate, CompanyUpdate, CRMCompaniesResponse
from . import logic

router = APIRouter()


@router.get("/companies", response_model=CRMCompaniesResponse)
async def get_crm_companies(
    industry: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_companies(db, current_user, tenant_context, industry, size, search, page, limit)


@router.post("/companies", response_model=Company)
async def create_crm_company(
    company_data: CompanyCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return logic.create_crm_company(company_data, current_user, db, tenant_context)


@router.get("/companies/{company_id}", response_model=Company)
async def get_crm_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_crm_company(company_id, db, current_user, tenant_context)


@router.put("/companies/{company_id}", response_model=Company)
async def update_crm_company(
    company_id: str,
    company_data: CompanyUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.update_crm_company(company_id, company_data, current_user, db, tenant_context)


@router.delete("/companies/{company_id}")
async def delete_crm_company(
    company_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return logic.delete_crm_company(company_id, current_user, db, tenant_context)
