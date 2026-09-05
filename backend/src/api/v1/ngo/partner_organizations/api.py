from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from .....config.database import get_db
from .....api.dependencies import get_tenant_context, require_permission
from ...http_common import tenant_id_str
from .schemas import PartnerOrganization, PartnerOrganizationCreate, PartnerOrganizationUpdate, PartnerOrganizationsResponse
from . import logic

router = APIRouter()


@router.get("/partner-organizations", response_model=PartnerOrganizationsResponse)
async def list_partner_organizations(
    search: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    organization_size: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:partner-organizations:view")),
):
    return logic.list_partner_organizations(
        tenant_id_str(tenant_context),
        db,
        search=search,
        sector=sector,
        organization_size=organization_size,
        status=status,
        page=page,
        limit=limit,
    )


@router.get("/partner-organizations/{partner_id}", response_model=PartnerOrganization)
async def get_partner_organization(
    partner_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:partner-organizations:view")),
):
    return logic.get_partner_organization(tenant_id_str(tenant_context), partner_id, db)


@router.post("/partner-organizations", response_model=PartnerOrganization, status_code=status.HTTP_201_CREATED)
async def create_partner_organization(
    body: PartnerOrganizationCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:partner-organizations:create")),
):
    return logic.create_partner_record(tenant_id_str(tenant_context), body, db)


@router.put("/partner-organizations/{partner_id}", response_model=PartnerOrganization)
async def update_partner_organization(
    partner_id: str,
    body: PartnerOrganizationUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:partner-organizations:update")),
):
    return logic.update_partner_record(tenant_id_str(tenant_context), partner_id, body, db)


@router.delete("/partner-organizations/{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner_organization(
    partner_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:partner-organizations:delete")),
):
    logic.delete_partner_record(tenant_id_str(tenant_context), partner_id, db)
