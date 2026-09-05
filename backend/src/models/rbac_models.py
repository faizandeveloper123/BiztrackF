from __future__ import annotations


def __getattr__(name: str):
    import importlib

    _map = {
        **{k: "roles" for k in (
            "RoleBase", "RoleCreate", "RoleUpdate", "Role", "RolesResponse",
        )},
        **{k: "tenant_users" for k in (
            "TenantUserBase", "TenantUserCreate", "TenantUserUpdate", "TenantUser",
            "TenantUsersResponse", "UserWithPermissions",
        )},
        **{k: "permissions" for k in (
            "RoleSummary", "UserPermissionsResponse", "CheckPermissionResponse",
        )},
    }
    mod = _map.get(name)
    if mod is None:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    m = importlib.import_module(f"..api.v1.rbac.{mod}.schemas", __package__)
    return getattr(m, name)


__all__ = [
    "RoleBase", "RoleCreate", "RoleUpdate", "Role", "RolesResponse",
    "TenantUserBase", "TenantUserCreate", "TenantUserUpdate", "TenantUser",
    "TenantUsersResponse", "UserWithPermissions",
    "RoleSummary", "UserPermissionsResponse", "CheckPermissionResponse",
]
