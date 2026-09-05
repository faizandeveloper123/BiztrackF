from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from .....config.database import get_db
from .....api.dependencies import get_tenant_context, require_permission
from ...http_common import tenant_id_str
from .schemas import Donor, DonorCreate, DonorUpdate, DonorsResponse
from . import logic

router = APIRouter()


@router.get("/donors", response_model=DonorsResponse)
async def list_donors(
    search: Optional[str] = Query(None),
    donor_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:donors:view")),
):
    return logic.list_donors(
        tenant_id_str(tenant_context),
        db,
        search=search,
        donor_type=donor_type,
        status=status,
        page=page,
        limit=limit,
    )


@router.get("/donors/{donor_id}", response_model=Donor)
async def get_donor(
    donor_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:donors:view")),
):
    return logic.get_donor(tenant_id_str(tenant_context), donor_id, db)


@router.post("/donors", response_model=Donor, status_code=status.HTTP_201_CREATED)
async def create_donor_endpoint(
    body: DonorCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:donors:create")),
):
    return logic.create_donor_record(tenant_id_str(tenant_context), body, db)


@router.put("/donors/{donor_id}", response_model=Donor)
async def update_donor_endpoint(
    donor_id: str,
    body: DonorUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:donors:update")),
):
    return logic.update_donor_record(tenant_id_str(tenant_context), donor_id, body, db)


@router.delete("/donors/{donor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_donor_endpoint(
    donor_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(require_permission("ngo:donors:delete")),
):
    logic.delete_donor_record(tenant_id_str(tenant_context), donor_id, db)
