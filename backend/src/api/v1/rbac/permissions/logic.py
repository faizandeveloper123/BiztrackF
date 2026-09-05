from typing import Optional

from sqlalchemy.orm import Session

from .schemas import CheckPermissionResponse, RoleSummary, UserPermissionsResponse
from .....services.rbac_service import RBACService


def get_user_permissions_response(
    db: Session,
    tenant_id: Optional[str],
    user_id: str,
) -> UserPermissionsResponse:
    if not tenant_id:
        return UserPermissionsResponse(
            permissions=[],
            accessible_modules=[],
            is_owner=False,
            role=None,
        )
    permissions = RBACService.get_user_permissions(db, user_id, tenant_id)
    accessible_modules = RBACService.get_accessible_modules(db, user_id, tenant_id)
    is_owner = RBACService.is_owner(db, user_id, tenant_id)
    user_role = RBACService.get_user_role(db, user_id, tenant_id)
    role = None
    if user_role:
        role = RoleSummary(name=user_role.name, display_name=user_role.display_name)
    return UserPermissionsResponse(
        permissions=permissions,
        accessible_modules=accessible_modules,
        is_owner=is_owner,
        role=role,
    )


def check_permission(
    db: Session,
    tenant_id: Optional[str],
    user_id: str,
    permission: str,
) -> CheckPermissionResponse:
    if not tenant_id:
        return CheckPermissionResponse(permission=permission, has_permission=False)
    has_perm = RBACService.has_permission(db, user_id, tenant_id, permission)
    return CheckPermissionResponse(permission=permission, has_permission=has_perm)
