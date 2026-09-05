from typing import List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from ..config.database import get_subscription_by_tenant
from ..core.plan_types import (
    filter_modules_for_plan,
    filter_permissions_for_plan,
    is_module_excluded_for_plan,
)
from ..models.common import ModulePermission, TenantRole
from ..models.platform import User
from ..models.rbac import Role, TenantUser


def permission_satisfied(user_permissions: List[str], required: str) -> bool:
    """Check whether a user's permission list satisfies a required permission.

    A module-level permission (``module:action``) is satisfied by any matching
    granular permission (``module:resource:action``), and a granular permission
    is satisfied by the matching module-level permission (``module:action``).
    """
    if required in user_permissions:
        return True
    segments = required.split(":")
    if len(segments) == 2:
        module, action = segments
        prefix = f"{module}:"
        for user_permission in user_permissions:
            if user_permission.startswith(prefix) and user_permission.endswith(f":{action}"):
                return True
    elif len(segments) == 3:
        module, action = segments[0], segments[2]
        if f"{module}:{action}" in user_permissions:
            return True
    return False


def _crud(prefix: str) -> List[str]:
    return [f"{prefix}:view", f"{prefix}:create", f"{prefix}:update", f"{prefix}:delete"]


GRANULAR_PERMISSIONS = {
    "crm": [
        "crm:dashboard:view",
        *_crud("crm:customers"),
        *_crud("crm:companies"),
        *_crud("crm:contacts"),
        *_crud("crm:leads"),
        *_crud("crm:opportunities"),
        *_crud("crm:activities"),
    ],
    "sales": [
        *_crud("sales:quotes"),
        *_crud("sales:contracts"),
        "sales:analytics:view",
        *_crud("sales:invoices"),
        "sales:invoice_dashboard:view",
        *_crud("sales:installments"),
        *_crud("sales:delivery_notes"),
    ],
    "hrm": [
        *_crud("hrm:employees"),
        *_crud("hrm:jobs"),
        *_crud("hrm:reviews"),
        *_crud("hrm:leave_requests"),
        *_crud("hrm:training"),
        *_crud("hrm:payroll"),
        *_crud("hrm:suppliers"),
    ],
    "inventory": [
        *_crud("inventory:warehouses"),
        *_crud("inventory:storage_locations"),
        *_crud("inventory:stock_movements"),
        *_crud("inventory:purchase_orders"),
        *_crud("inventory:receiving"),
        *_crud("inventory:products"),
        *_crud("inventory:alerts"),
        *_crud("inventory:dumps"),
        *_crud("inventory:customer_returns"),
        *_crud("inventory:supplier_returns"),
    ],
    "projects": [
        *_crud("projects:projects"),
        *_crud("projects:tasks"),
        *_crud("projects:team_members"),
        *_crud("projects:time_tracking"),
    ],
    "production": [
        *_crud("production:job_cards"),
        *_crud("production:vehicles"),
    ],
    "quality": [
        *_crud("quality:quality_control"),
    ],
    "banking": [
        *_crud("banking:accounts"),
        *_crud("banking:transactions"),
        *_crud("banking:reconciliation"),
        *_crud("banking:tills"),
        *_crud("banking:till_transactions"),
    ],
    "ledger": [
        *_crud("ledger:chart_of_accounts"),
        *_crud("ledger:transactions"),
        *_crud("ledger:journal_entries"),
        *_crud("ledger:budgets"),
        *_crud("ledger:account_receivables"),
        *_crud("ledger:investments"),
        "ledger:reports:view",
        "ledger:profit_loss:view",
    ],
    "pos": [
        *_crud("pos:sale"),
        *_crud("pos:products"),
        *_crud("pos:transactions"),
        *_crud("pos:shifts"),
        "pos:reports:view",
    ],
    "mot": [
        *_crud("mot:bookings"),
        "mot:settings:view",
        "mot:settings:update",
    ],
    "notifications": [
        "notifications:view",
    ],
    "workshop": [
        *_crud("workshop:customers"),
        *_crud("workshop:job_cards"),
        *_crud("workshop:vehicles"),
        *_crud("workshop:quality_control"),
    ],
    "healthcare": [
        *_crud("healthcare:appointments"),
        *_crud("healthcare:patients"),
        *_crud("healthcare:doctors"),
        *_crud("healthcare:staff"),
        *_crud("healthcare:admissions"),
        *_crud("healthcare:expenses"),
    ],
    "ngo": [
        *_crud("ngo:donors"),
        *_crud("ngo:donor_leads"),
        *_crud("ngo:donor_contacts"),
        *_crud("ngo:partner-organizations"),
    ],
    "users": _crud("users"),
    "dashboard": ["dashboard:view"],
}


def _merge_permissions(*groups: List[str]) -> List[str]:
    merged: List[str] = []
    for group in groups:
        for permission in group:
            value = permission.value if isinstance(permission, ModulePermission) else permission
            if value not in merged:
                merged.append(value)
    return merged


DEFAULT_ROLE_PERMISSIONS = {
    TenantRole.OWNER: _merge_permissions([
        ModulePermission.CRM_VIEW, ModulePermission.CRM_CREATE, ModulePermission.CRM_UPDATE, ModulePermission.CRM_DELETE,
        ModulePermission.HRM_VIEW, ModulePermission.HRM_CREATE, ModulePermission.HRM_UPDATE, ModulePermission.HRM_DELETE,
        ModulePermission.INVENTORY_VIEW, ModulePermission.INVENTORY_CREATE, ModulePermission.INVENTORY_UPDATE, ModulePermission.INVENTORY_DELETE,
        ModulePermission.FINANCE_VIEW, ModulePermission.FINANCE_CREATE, ModulePermission.FINANCE_UPDATE, ModulePermission.FINANCE_DELETE,
        ModulePermission.SALES_VIEW, ModulePermission.SALES_CREATE, ModulePermission.SALES_UPDATE, ModulePermission.SALES_DELETE,
        ModulePermission.PROJECTS_VIEW, ModulePermission.PROJECTS_CREATE, ModulePermission.PROJECTS_UPDATE, ModulePermission.PROJECTS_DELETE,
        ModulePermission.PRODUCTION_VIEW, ModulePermission.PRODUCTION_CREATE, ModulePermission.PRODUCTION_UPDATE, ModulePermission.PRODUCTION_DELETE,
        ModulePermission.QUALITY_VIEW, ModulePermission.QUALITY_CREATE, ModulePermission.QUALITY_UPDATE, ModulePermission.QUALITY_DELETE,
        ModulePermission.BANKING_VIEW, ModulePermission.BANKING_CREATE, ModulePermission.BANKING_UPDATE, ModulePermission.BANKING_DELETE,
        ModulePermission.EVENTS_VIEW, ModulePermission.EVENTS_CREATE, ModulePermission.EVENTS_UPDATE, ModulePermission.EVENTS_DELETE,
        ModulePermission.USERS_VIEW, ModulePermission.USERS_CREATE, ModulePermission.USERS_UPDATE, ModulePermission.USERS_DELETE,
        ModulePermission.REPORTS_VIEW, ModulePermission.REPORTS_EXPORT,
        ModulePermission.HEALTHCARE_VIEW, ModulePermission.HEALTHCARE_CREATE, ModulePermission.HEALTHCARE_UPDATE, ModulePermission.HEALTHCARE_DELETE,
        ModulePermission.NGO_VIEW, ModulePermission.NGO_CREATE, ModulePermission.NGO_UPDATE, ModulePermission.NGO_DELETE
    ], *[permissions for permissions in GRANULAR_PERMISSIONS.values()]),
    TenantRole.CRM_MANAGER: _merge_permissions([
        ModulePermission.CRM_VIEW, ModulePermission.CRM_CREATE, ModulePermission.CRM_UPDATE, ModulePermission.CRM_DELETE,
        ModulePermission.EVENTS_VIEW, ModulePermission.EVENTS_CREATE, ModulePermission.EVENTS_UPDATE, ModulePermission.EVENTS_DELETE,
        ModulePermission.REPORTS_VIEW
    ], GRANULAR_PERMISSIONS["crm"]),
    TenantRole.HRM_MANAGER: _merge_permissions([
        ModulePermission.HRM_VIEW, ModulePermission.HRM_CREATE, ModulePermission.HRM_UPDATE, ModulePermission.HRM_DELETE,
        ModulePermission.REPORTS_VIEW
    ], GRANULAR_PERMISSIONS["hrm"]),
    TenantRole.INVENTORY_MANAGER: _merge_permissions([
        ModulePermission.INVENTORY_VIEW, ModulePermission.INVENTORY_CREATE, ModulePermission.INVENTORY_UPDATE, ModulePermission.INVENTORY_DELETE,
        ModulePermission.REPORTS_VIEW
    ], GRANULAR_PERMISSIONS["inventory"]),
    TenantRole.FINANCE_MANAGER: _merge_permissions([
        ModulePermission.FINANCE_VIEW, ModulePermission.FINANCE_CREATE, ModulePermission.FINANCE_UPDATE, ModulePermission.FINANCE_DELETE,
        ModulePermission.BANKING_VIEW, ModulePermission.BANKING_CREATE, ModulePermission.BANKING_UPDATE, ModulePermission.BANKING_DELETE,
        ModulePermission.REPORTS_VIEW, ModulePermission.REPORTS_EXPORT
    ], GRANULAR_PERMISSIONS["banking"], GRANULAR_PERMISSIONS["ledger"]),
    TenantRole.PROJECT_MANAGER: _merge_permissions([
        ModulePermission.PROJECTS_VIEW, ModulePermission.PROJECTS_CREATE, ModulePermission.PROJECTS_UPDATE, ModulePermission.PROJECTS_DELETE,
        ModulePermission.EVENTS_VIEW, ModulePermission.EVENTS_CREATE, ModulePermission.EVENTS_UPDATE, ModulePermission.EVENTS_DELETE,
        ModulePermission.REPORTS_VIEW
    ], GRANULAR_PERMISSIONS["projects"]),
    TenantRole.PRODUCTION_MANAGER: _merge_permissions([
        ModulePermission.PRODUCTION_VIEW, ModulePermission.PRODUCTION_CREATE, ModulePermission.PRODUCTION_UPDATE, ModulePermission.PRODUCTION_DELETE,
        ModulePermission.REPORTS_VIEW
    ], GRANULAR_PERMISSIONS["production"]),
    TenantRole.QUALITY_MANAGER: _merge_permissions([
        ModulePermission.QUALITY_VIEW, ModulePermission.QUALITY_CREATE, ModulePermission.QUALITY_UPDATE, ModulePermission.QUALITY_DELETE,
        ModulePermission.REPORTS_VIEW
    ], GRANULAR_PERMISSIONS["quality"]),
}


OWNER_ACCESSIBLE_MODULES = [
    'crm', 'sales', 'pos', 'inventory', 'hrm', 'projects', 'reports', 'events',
    'production', 'quality', 'banking', 'ledger',
    'finance', 'settings', 'notifications', 'users', 'dashboard', 'healthcare', 'ngo',
    'mot', 'workshop',
]

VALID_ACTIONS = {"view", "create", "update", "delete", "export"}

# Modules known to have granular resource permissions.
GRANULAR_MODULES = set(GRANULAR_PERMISSIONS.keys())


def validate_permissions(permissions) -> Optional[str]:
    """Validate a list of permission strings.

    Accepts any permission whose module is known and whose action is valid.
    Returns an error message string, or ``None`` if all permissions are valid.
    """
    if not isinstance(permissions, (list, tuple)):
        return "permissions must be a list of strings"
    for permission in permissions:
        if not isinstance(permission, str) or not permission.strip():
            return "permissions must be a list of strings"
        parts = permission.strip().split(":")
        if len(parts) not in (2, 3):
            return f"Invalid permission format: '{permission}' (expected module:action or module:resource:action)"
        module = parts[0]
        action = parts[-1]
        if module not in GRANULAR_MODULES and module not in OWNER_ACCESSIBLE_MODULES:
            return f"Unknown permission module: '{module}' in '{permission}'"
        if action not in VALID_ACTIONS:
            return f"Invalid permission action: '{action}' in '{permission}'"
    return None


class RBACService:
    @staticmethod
    def _get_tenant_plan_type(db: Session, tenant_id: str) -> Optional[str]:
        subscription = get_subscription_by_tenant(tenant_id, db)
        if not subscription or not subscription.plan:
            return None
        return subscription.plan.planType

    @staticmethod
    def create_default_roles(db: Session, tenant_id: str) -> List[Role]:
        existing = {
            role.name
            for role in db.query(Role).filter(Role.tenant_id == tenant_id).all()
        }
        roles = []
        for role_name, permissions in DEFAULT_ROLE_PERMISSIONS.items():
            if role_name.value in existing:
                continue
            role = Role(
                tenant_id=tenant_id,
                name=role_name.value,
                display_name=role_name.value.replace('_', ' ').title(),
                description=f"Default {role_name.value.replace('_', ' ')} role",
                permissions=[p.value if isinstance(p, ModulePermission) else p for p in permissions],
                isActive=True,
            )
            db.add(role)
            roles.append(role)
        db.commit()
        return roles

    @staticmethod
    def _implied_view_permissions(permissions: List[str]) -> List[str]:
        """Automatically grant view permission when create/update/delete is granted.

        A user who can create, update or delete a resource must be able to see it,
        otherwise the resource is unreachable from the UI. This expands both
        module-level (``crm:create`` -> ``crm:view``) and granular
        (``crm:customers:create`` -> ``crm:customers:view``) permissions.
        """
        result = list(permissions)
        for permission in permissions:
            parts = permission.split(":")
            if len(parts) not in (2, 3):
                continue
            action = parts[-1]
            if action not in ("create", "update", "delete"):
                continue
            view_permission = f"{parts[0]}:{parts[1]}:view" if len(parts) == 3 else f"{parts[0]}:view"
            if view_permission not in result:
                result.append(view_permission)
        return result

    @staticmethod
    def get_user_permissions(db: Session, user_id: str, tenant_id: str) -> List[str]:
        tenant_user = db.query(TenantUser).join(Role).filter(
            and_(
                TenantUser.userId == user_id,
                TenantUser.tenant_id == tenant_id,
                TenantUser.isActive == True,
                Role.isActive == True,
            )
        ).first()
        if not tenant_user:
            return []
        role_permissions = tenant_user.role_obj.permissions if tenant_user.role_obj else []
        custom_permissions = tenant_user.custom_permissions or []
        if tenant_user.role_obj and tenant_user.role_obj.name == TenantRole.OWNER.value:
            owner_default = DEFAULT_ROLE_PERMISSIONS[TenantRole.OWNER]
            role_permissions = list(set(role_permissions + owner_default))
        all_permissions = list(set(role_permissions + custom_permissions))
        all_permissions = RBACService._implied_view_permissions(all_permissions)
        if all_permissions and "dashboard:view" not in all_permissions:
            all_permissions.append("dashboard:view")
        if all_permissions and "notifications:view" not in all_permissions:
            all_permissions.append("notifications:view")
        plan_type = RBACService._get_tenant_plan_type(db, tenant_id)
        return filter_permissions_for_plan(all_permissions, plan_type)

    @staticmethod
    def has_permission(db: Session, user_id: str, tenant_id: str, permission: str) -> bool:
        plan_type = RBACService._get_tenant_plan_type(db, tenant_id)
        module = permission.split(":")[0] if ":" in permission else ""
        if module and is_module_excluded_for_plan(plan_type, module):
            return False
        if RBACService.is_owner(db, user_id, tenant_id):
            return True
        return permission_satisfied(RBACService.get_user_permissions(db, user_id, tenant_id), permission)

    @staticmethod
    def has_module_access(db: Session, user_id: str, tenant_id: str, module: str) -> bool:
        plan_type = RBACService._get_tenant_plan_type(db, tenant_id)
        if is_module_excluded_for_plan(plan_type, module):
            return False
        user_permissions = RBACService.get_user_permissions(db, user_id, tenant_id)
        return any(p.startswith(f"{module}:") for p in user_permissions)

    @staticmethod
    def get_user_role(db: Session, user_id: str, tenant_id: str) -> Optional[Role]:
        tenant_user = db.query(TenantUser).join(Role).filter(
            and_(
                TenantUser.userId == user_id,
                TenantUser.tenant_id == tenant_id,
                TenantUser.isActive == True,
                Role.isActive == True,
            )
        ).first()
        return tenant_user.role_obj if tenant_user else None

    @staticmethod
    def is_owner(db: Session, user_id: str, tenant_id: str) -> bool:
        role = RBACService.get_user_role(db, user_id, tenant_id)
        return bool(role and role.name == TenantRole.OWNER.value)

    @staticmethod
    def get_owner_user_ids(db: Session, tenant_id: str) -> List[str]:
        rows = db.query(TenantUser.userId).join(Role).filter(
            and_(
                TenantUser.tenant_id == tenant_id,
                TenantUser.isActive == True,
                Role.name == TenantRole.OWNER.value,
                Role.isActive == True,
            )
        ).all()
        return [str(row[0]) for row in rows]

    @staticmethod
    def can_manage_users(db: Session, user_id: str, tenant_id: str) -> bool:
        if RBACService.is_owner(db, user_id, tenant_id):
            return True
        return RBACService.has_permission(db, user_id, tenant_id, ModulePermission.USERS_CREATE.value)

    @staticmethod
    def get_accessible_modules(db: Session, user_id: str, tenant_id: str) -> List[str]:
        plan_type = RBACService._get_tenant_plan_type(db, tenant_id)
        if RBACService.is_owner(db, user_id, tenant_id):
            modules = list(OWNER_ACCESSIBLE_MODULES)
        else:
            user_permissions = RBACService.get_user_permissions(db, user_id, tenant_id)
            modules = {
                permission.split(':')[0]
                for permission in user_permissions
                if ':' in permission
            }
            if user_permissions:
                modules.add("dashboard")
            modules = list(modules)
        return filter_modules_for_plan(modules, plan_type)

    @staticmethod
    def validate_email_uniqueness(db: Session, email: str, tenant_id: str = None, exclude_user_id: Optional[str] = None) -> bool:
        from sqlalchemy import func

        if not email:
            return True
        query = db.query(User).filter(func.lower(User.email) == email.strip().lower())
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        return query.first() is None

    @staticmethod
    def validate_username_uniqueness(db: Session, username: str, tenant_id: str, exclude_user_id: Optional[str] = None) -> bool:
        query = db.query(User).join(TenantUser).filter(
            and_(
                User.userName == username,
                TenantUser.tenant_id == tenant_id,
                TenantUser.isActive == True,
            )
        )
        if exclude_user_id:
            query = query.filter(User.id != exclude_user_id)
        return query.first() is None
