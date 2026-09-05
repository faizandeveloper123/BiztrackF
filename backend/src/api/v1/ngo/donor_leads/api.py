from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from ...http_common import tenant_id_str
from .schemas import DonorLead, DonorLeadCreate, DonorLeadUpdate, DonorLeadsResponse
from . import logic

router = APIRouter()


@router.get("/donor-leads", response_model=DonorLeadsResponse)
async def list_donor_leads(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    created_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:donor_leads:view")),
):
    return logic.list_donor_leads(
        tenant_id_str(tenant_context),
        db,
        search=search,
        status=status,
        source=source,
        created_date=created_date,
        page=page,
        limit=limit,
    )


@router.get("/donor-leads/{lead_id}", response_model=DonorLead)
async def get_donor_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:donor_leads:view")),
):
    return logic.get_donor_lead(tenant_id_str(tenant_context), lead_id, db)


@router.post("/donor-leads", response_model=DonorLead, status_code=status.HTTP_201_CREATED)
async def create_donor_lead(
    body: DonorLeadCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:donor_leads:create")),
):
    return logic.create_donor_lead_record(tenant_id_str(tenant_context), body, db)


@router.put("/donor-leads/{lead_id}", response_model=DonorLead)
async def update_donor_lead(
    lead_id: str,
    body: DonorLeadUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:donor_leads:update")),
):
    return logic.update_donor_lead_record(tenant_id_str(tenant_context), lead_id, body, db)


@router.delete("/donor-leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_donor_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:donor_leads:delete")),
):
    logic.delete_donor_lead_record(tenant_id_str(tenant_context), lead_id, db)
