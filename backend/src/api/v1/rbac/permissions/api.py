from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from .....api.dependencies import get_current_user, get_tenant_context
from .....config.database import get_db
from .schemas import CheckPermissionResponse, UserPermissionsResponse
from . import logic

router = APIRouter()


@router.get("/permissions", response_model=UserPermissionsResponse)
async def get_user_permissions(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    current_user=Depends(get_current_user),
):
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    return logic.get_user_permissions_response(db, tenant_id, str(current_user.id))


@router.get("/check-permission/{permission}", response_model=CheckPermissionResponse)
async def check_permission(
    permission: str,
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    current_user=Depends(get_current_user),
):
    tenant_id = tenant_context["tenant_id"] if tenant_context else None
    return logic.check_permission(db, tenant_id, str(current_user.id), permission)
