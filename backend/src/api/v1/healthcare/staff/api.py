from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from ...http_common import tenant_id_str
from .....models.common import ModulePermission
from .schemas import HealthcareStaff, HealthcareStaffCreate, HealthcareStaffUpdate, HealthcareStaffResponse
from . import logic

router = APIRouter()


@router.get("/staff", response_model=HealthcareStaffResponse)
async def list_healthcare_staff(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.list_healthcare_staff(
        tenant_id_str(tenant_context), db, search=search, is_active=is_active, page=page, limit=limit
    )


@router.post("/staff", response_model=HealthcareStaff, status_code=status.HTTP_201_CREATED)
async def create_healthcare_staff_endpoint(
    body: HealthcareStaffCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(require_permission(ModulePermission.USERS_CREATE.value)),
):
    return logic.create_healthcare_staff(
        tenant_id_str(tenant_context), body, db, str(current_user.id)
    )


@router.put("/staff/{staff_id}", response_model=HealthcareStaff)
async def update_healthcare_staff_endpoint(
    staff_id: str,
    body: HealthcareStaffUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(require_permission(ModulePermission.USERS_UPDATE.value)),
):
    return logic.update_healthcare_staff(tenant_id_str(tenant_context), staff_id, body, db)


@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_healthcare_staff_endpoint(
    staff_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(require_permission(ModulePermission.USERS_DELETE.value)),
):
    logic.delete_healthcare_staff(tenant_id_str(tenant_context), staff_id, db)
