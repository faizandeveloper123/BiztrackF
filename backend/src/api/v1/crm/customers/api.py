from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from ..customers.schemas import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerStatsResponse, CustomersListResponse,
)
from ..shared import CustomerPhotoUpload
from . import logic

router = APIRouter()


@router.post("/customers", response_model=CustomerResponse)
async def create_customer_endpoint(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return logic.create_customer_endpoint(customer_data, db, current_user, tenant_context)


@router.get("/customers", response_model=CustomersListResponse)
async def get_customers_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    customer_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_customers_endpoint(db, current_user, tenant_context, skip, limit, search, status, customer_type)


@router.get("/customers/stats", response_model=CustomerStatsResponse)
async def get_customer_stats_endpoint(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_customer_stats_endpoint(db, current_user, tenant_context)


@router.get("/customers/search", response_model=List[CustomerResponse])
async def search_customers_endpoint(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.search_customers_endpoint(db, current_user, tenant_context, q, limit)


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer_endpoint(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_customer_endpoint(customer_id, db, current_user, tenant_context)


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer_endpoint(
    customer_id: str,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.update_customer_endpoint(customer_id, customer_data, db, current_user, tenant_context)


@router.delete("/customers/{customer_id}")
async def delete_customer_endpoint(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return logic.delete_customer_endpoint(customer_id, db, current_user, tenant_context)


@router.patch("/customers/{customer_id}/photo", response_model=CustomerResponse)
async def upload_customer_photo(
    customer_id: str,
    body: CustomerPhotoUpload,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.upload_customer_photo(customer_id, body, db, current_user, tenant_context)


@router.delete("/customers/{customer_id}/photo", response_model=CustomerResponse)
async def delete_customer_photo(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.delete_customer_photo(customer_id, db, current_user, tenant_context)
