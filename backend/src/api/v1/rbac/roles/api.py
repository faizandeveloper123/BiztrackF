from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from .....api.dependencies import get_tenant_context, require_permission
from .....config.database import get_db
from .....models.common import ModulePermission
from .schemas import Role, RoleCreate, RoleUpdate, RolesResponse
from . import logic

router = APIRouter()


@router.get("/roles", response_model=RolesResponse)
async def get_roles(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.USERS_VIEW.value)),
):
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    return logic.get_roles(db, tenant_id)


@router.post("/roles", response_model=Role)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.USERS_CREATE.value)),
):
    return logic.create_role(db, tenant_context["tenant_id"], role_data)


@router.put("/roles/{role_id}", response_model=Role)
async def update_role(
    role_id: str,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.USERS_UPDATE.value)),
):
    return logic.update_role(db, tenant_context["tenant_id"], role_id, role_data)


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.USERS_DELETE.value)),
):
    return logic.delete_role(db, tenant_context["tenant_id"], role_id)
