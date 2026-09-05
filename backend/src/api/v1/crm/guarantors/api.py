from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from .schemas import GuarantorCreate, GuarantorUpdate, GuarantorResponse
from . import logic

router = APIRouter()


@router.get("/customers/{customer_id}/guarantors", response_model=List[GuarantorResponse])
async def get_customer_guarantors(
    customer_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value)),
):
    return logic.get_customer_guarantors(customer_id, db, current_user, tenant_context)


@router.post("/customers/{customer_id}/guarantors", response_model=GuarantorResponse)
async def create_guarantor_endpoint(
    customer_id: str,
    data: GuarantorCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value)),
):
    return logic.create_guarantor_endpoint(customer_id, data, db, current_user, tenant_context)


@router.put("/guarantors/{guarantor_id}", response_model=GuarantorResponse)
async def update_guarantor_endpoint(
    guarantor_id: str,
    data: GuarantorUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value)),
):
    return logic.update_guarantor_endpoint(guarantor_id, data, db, current_user, tenant_context)


@router.delete("/guarantors/{guarantor_id}")
async def delete_guarantor_endpoint(
    guarantor_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value)),
):
    return logic.delete_guarantor_endpoint(guarantor_id, db, current_user, tenant_context)
