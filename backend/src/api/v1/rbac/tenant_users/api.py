from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....config.database import get_db
from .....models.common import ModulePermission
from .....models.user_models import User, UserCreate
from .schemas import TenantUser, TenantUserCreate, TenantUserUpdate, UserWithPermissions
from . import logic

router = APIRouter()


@router.get("/tenant-users", response_model=List[UserWithPermissions])
async def get_tenant_users(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.USERS_VIEW.value)),
):
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    return logic.get_tenant_users_list(db, tenant_id)


@router.post("/tenant-users", response_model=TenantUser)
async def create_tenant_user(
    user_data: TenantUserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(get_current_user),
    _: dict = Depends(require_permission(ModulePermission.USERS_CREATE.value)),
):
    return logic.add_user_to_tenant(
        db, tenant_context["tenant_id"], user_data, current_user, background_tasks
    )


@router.put("/tenant-users/{tenant_user_id}", response_model=TenantUser)
async def update_tenant_user(
    tenant_user_id: str,
    user_data: TenantUserUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(get_current_user),
    _: dict = Depends(require_permission(ModulePermission.USERS_UPDATE.value)),
):
    return logic.update_rbac_tenant_user(
        db, tenant_context["tenant_id"], tenant_user_id, user_data, current_user
    )


@router.delete("/tenant-users/{tenant_user_id}")
async def remove_tenant_user(
    tenant_user_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(get_current_user),
    _: dict = Depends(require_permission(ModulePermission.USERS_DELETE.value)),
):
    return logic.remove_tenant_user(
        db, tenant_context["tenant_id"], tenant_user_id, str(current_user.id)
    )


@router.delete("/remove-user/{user_id}")
async def remove_user_from_tenant(
    user_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(get_current_user),
    _: dict = Depends(require_permission(ModulePermission.USERS_DELETE.value)),
):
    return logic.remove_user_by_id(
        db, tenant_context["tenant_id"], user_id, str(current_user.id)
    )


@router.delete("/force-delete-user/{user_id}")
async def force_delete_user_from_tenant(
    user_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(get_current_user),
    _: dict = Depends(require_permission(ModulePermission.USERS_DELETE.value)),
):
    return logic.force_delete_user_by_id(
        db, tenant_context["tenant_id"], user_id, str(current_user.id)
    )


@router.post("/create-user", response_model=User)
async def create_user_for_tenant(
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    role_id: str = Query(..., description="Role ID to assign to the user"),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    current_user=Depends(get_current_user),
    _: dict = Depends(require_permission(ModulePermission.USERS_CREATE.value)),
):
    return logic.create_user_for_tenant(
        db,
        tenant_context["tenant_id"],
        user_data,
        role_id,
        current_user,
        background_tasks,
    )
