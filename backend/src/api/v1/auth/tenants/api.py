from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .....config.database import get_db
from .....api.dependencies import get_current_user
from .schemas import TenantSelectionRequest, TenantSelectionResponse, MyTenantsResponse
from . import logic

router = APIRouter()


@router.post("/select-tenant", response_model=TenantSelectionResponse)
async def select_tenant(
    tenant_request: TenantSelectionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await logic.select_tenant(tenant_request, current_user, db)


@router.get("/my-tenants", response_model=MyTenantsResponse)
async def get_my_tenants(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await logic.get_my_tenants(current_user, db)
