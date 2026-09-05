from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from .....config.database import get_db
from .....api.dependencies import get_current_user
from .schemas import TenantStatusUpdate, TenantDeleteRequest, TenantStripeToggle
from . import logic

router = APIRouter()


@router.get("/tenants", response_model=List[dict])
async def get_all_tenants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.get_all_tenants(skip, limit, search, is_active, db, current_user)


@router.get("/tenants/{tenant_id}", response_model=dict)
async def get_tenant_details(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.get_tenant_details(tenant_id, db, current_user)


@router.put("/tenants/{tenant_id}/status")
async def update_tenant_status(
    tenant_id: str,
    status_data: TenantStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.update_tenant_status(tenant_id, status_data, db, current_user)


@router.put("/tenants/{tenant_id}/stripe")
async def toggle_tenant_stripe(
    tenant_id: str,
    toggle_data: TenantStripeToggle,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.toggle_tenant_stripe(tenant_id, toggle_data, db, current_user)


@router.delete("/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    delete_request: TenantDeleteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.delete_tenant(tenant_id, delete_request, db, current_user)


@router.get("/tenants/{tenant_id}/complete")
async def get_tenant_complete_details(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await logic.get_tenant_complete_details(tenant_id, db, current_user)
