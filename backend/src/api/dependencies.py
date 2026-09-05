
from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..core.auth import verify_token
from ..config.database import (
    get_db, get_user_by_email, get_user_tenants, get_tenant_by_id,
    get_subscription_by_tenant,
)
from ..services.rbac_service import RBACService, permission_satisfied
from sqlalchemy.orm import Session
from typing import Optional, List
from ..models.common import ModulePermission
import logging
import re

logger = logging.getLogger(__name__)

HTTP_METHOD_TO_ACTION = {
    "GET": "view",
    "POST": "create",
    "PUT": "update",
    "PATCH": "update",
    "DELETE": "delete",
}

PATH_MODULE_MAP = {
    "crm": "crm",
    "hrm": "hrm",
    "inventory": "inventory",
    "projects": "projects",
    "tasks": "projects",
    "sales": "sales",
    "invoices": "sales",
    "installments": "sales",
    "delivery-notes": "sales",
    "pos": "pos",
    "production": "production",
    "job-cards": "production",
    "vehicles": "production",
    "quality-control": "quality",
    "banking": "banking",
    "ledger": "ledger",
    "investments": "ledger",
    "reports": "reports",
    "events": "events",
    "healthcare": "healthcare",
    "users": "users",
    "dashboard": "dashboard",
    "mot": "mot",
    "ngo": "ngo",
}

RESOURCE_PATH_MAP = {
    "/crm/customers": "crm:customers",
    "/crm/companies": "crm:companies",
    "/crm/contacts": "crm:contacts",
    "/crm/leads": "crm:leads",
    "/crm/opportunities": "crm:opportunities",
    "/crm/activities": "crm:activities",
    "/crm/dashboard": "crm:dashboard",
    "/sales/quotes": "sales:quotes",
    "/sales/contracts": "sales:contracts",
    "/sales/analytics": "sales:analytics",
    "/invoices/dashboard": "sales:invoice_dashboard",
    "/invoices": "sales:invoices",
    "/installments": "sales:installments",
    "/delivery-notes": "sales:delivery_notes",
    "/inventory/warehouses": "inventory:warehouses",
    "/inventory/storage-locations": "inventory:storage_locations",
    "/inventory/stock-movements": "inventory:stock_movements",
    "/inventory/purchase-orders": "inventory:purchase_orders",
    "/inventory/receiving": "inventory:receiving",
    "/inventory/products": "inventory:products",
    "/inventory/alerts": "inventory:alerts",
    "/inventory/dumps": "inventory:dumps",
    "/inventory/customer-returns": "inventory:customer_returns",
    "/inventory/supplier-returns": "inventory:supplier_returns",
    "/projects/time-tracking": "projects:time_tracking",
    "/projects/team-members": "projects:team_members",
    "/tasks": "projects:tasks",
    "/job-cards": "production:job_cards",
    "/vehicles": "production:vehicles",
    "/quality-control": "quality:quality_control",
    "/banking/accounts": "banking:accounts",
    "/banking/transactions": "banking:transactions",
    "/banking/reconciliation": "banking:reconciliation",
    "/banking/tills": "banking:tills",
    "/banking/till-transactions": "banking:till_transactions",
    "/ledger/chart-of-accounts": "ledger:chart_of_accounts",
    "/ledger/transactions": "ledger:transactions",
    "/ledger/journal-entries": "ledger:journal_entries",
    "/ledger/budgets": "ledger:budgets",
    "/ledger/account-receivables": "ledger:account_receivables",
    "/ledger/reports/trial-balance": "ledger:reports",
    "/ledger/reports/income-statement": "ledger:reports",
    "/ledger/reports/balance-sheet": "ledger:reports",
    "/ledger/profit-loss-dashboard": "ledger:profit_loss",
    "/investments": "ledger:investments",
    "/pos/sale": "pos:sale",
    "/pos/products": "pos:products",
    "/pos/transactions": "pos:transactions",
    "/pos/shifts": "pos:shifts",
    "/pos/reports": "pos:reports",
    "/mot/bookings": "mot:bookings",
    "/mot/settings": "mot:settings",
    "/hrm/employees": "hrm:employees",
    "/hrm/jobs": "hrm:jobs",
    "/hrm/reviews": "hrm:reviews",
    "/hrm/leave-requests": "hrm:leave_requests",
    "/hrm/training": "hrm:training",
    "/hrm/payroll": "hrm:payroll",
    "/hrm/suppliers": "hrm:suppliers",
    "/healthcare/appointments": "healthcare:appointments",
    "/healthcare/patients": "healthcare:patients",
    "/healthcare/doctors": "healthcare:doctors",
    "/healthcare/staff": "healthcare:staff",
    "/healthcare/admissions": "healthcare:admissions",
    "/healthcare/daily-expenses": "healthcare:expenses",
    "/healthcare/expense-categories": "healthcare:expenses",
    "/ngo/donors": "ngo:donors",
    "/ngo/partner-organizations": "ngo:partner-organizations",
    "/ngo/donor-leads": "ngo:donor_leads",
    "/ngo/donor-contacts": "ngo:donor_contacts",
}

KNOWN_GENERIC_SEGMENTS = {
    "stats", "search", "download", "calendar", "dashboard", "overview",
    "bulk", "send", "send-whatsapp", "mark-as-paid", "mark-as-unpaid",
    "payments", "reports", "history", "approve", "reject", "start", "stop",
    "pause", "resume", "convert", "photo", "invoice", "reconcile", "summary",
    "seed-accounts", "seed-accounts-simple", "test"
}

UUID_RE = re.compile(
    r"^[0-9a-fA-F]{8}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{4}-?[0-9a-fA-F]{12}$"
)


def _is_dynamic_segment(segment: str) -> bool:
    if not segment:
        return True
    if segment.isdigit():
        return True
    if UUID_RE.match(segment):
        return True
    return False


def _normalize_segment(segment: str) -> str:
    return segment.replace("-", "_").lower()


def _build_permission_candidates(path: str, method: str) -> List[str]:
    action = HTTP_METHOD_TO_ACTION.get(method.upper())
    if not action:
        return []

    segments = [s for s in path.strip("/").split("/") if s]
    if not segments:
        return []

    normalized_path = "/" + "/".join(segments)
    for prefix, resource in sorted(RESOURCE_PATH_MAP.items(), key=lambda item: len(item[0]), reverse=True):
        if normalized_path.startswith(prefix):
            explicit = [f"{resource}:{action}", f"{resource.split(':')[0]}:{action}"]
            return list(dict.fromkeys(explicit))

    base_index = 0
    module_key = segments[base_index].lower()
    if module_key == "api" and len(segments) > 1:
        base_index = 1
        module_key = segments[base_index].lower()
    module = PATH_MODULE_MAP.get(module_key)
    if not module:
        return []

    static_segments: List[str] = []
    for segment in segments[base_index + 1:]:
        normalized = _normalize_segment(segment)
        if _is_dynamic_segment(normalized):
            continue
        static_segments.append(normalized)

    candidates: List[str] = [f"{module}:{action}"]

    if static_segments:
        for seg in reversed(static_segments):
            if seg in KNOWN_GENERIC_SEGMENTS:
                candidates.append(f"{module}:{seg}:{action}")
                continue
            candidates.append(f"{module}:{seg}:{action}")

    if f"{module}:dashboard:{action}" not in candidates and (not static_segments or static_segments[0] == "dashboard"):
        candidates.append(f"{module}:dashboard:{action}")

    deduped: List[str] = []
    for candidate in candidates:
        if candidate not in deduped:
            deduped.append(candidate)
    return deduped


def _enforce_granular_permission(
    request: Request,
    current_user,
    tenant_context: dict
):
    if not tenant_context:
        return

    if getattr(current_user, "userRole", None) == "super_admin":
        return

    if tenant_context.get("is_owner"):
        return

    candidates = _build_permission_candidates(request.url.path, request.method)
    if not candidates:
        return

    user_permissions = tenant_context.get("permissions", [])
    if any(permission_satisfied(user_permissions, permission) for permission in candidates):
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Permission denied: one of {candidates} is required"
    )

class CustomHTTPBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)
    
    async def __call__(self, request: Request) -> Optional[HTTPAuthorizationCredentials]:
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            logger.warning(
                f"Authentication failed: Missing Authorization header | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'} | "
                f"Tenant-ID: {request.headers.get('X-Tenant-ID', 'missing')}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authentication required: Missing Authorization header. Please provide a valid Bearer token."
            )
        
        if not auth_header.startswith("Bearer "):
            logger.warning(
                f"Authentication failed: Invalid Authorization header format | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'} | "
                f"Header format: {auth_header[:20]}..."
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Authentication required: Invalid Authorization header format. Expected 'Bearer <token>'."
            )
        
        return await super().__call__(request)

security = CustomHTTPBearer()

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        tenant_id = request.headers.get("X-Tenant-ID", "missing")
        
        logger.debug(
            f"Authenticating user | "
            f"URL: {request.url.path} | "
            f"Method: {request.method} | "
            f"Tenant-ID: {tenant_id} | "
            f"Token length: {len(token)}"
        )
        
        payload = verify_token(token, "access")
        email = payload.get("sub")
        
        if email is None:
            logger.warning(
                f"Authentication failed: Token missing email (sub claim) | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'} | "
                f"Tenant-ID: {tenant_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Missing user identifier in token"
            )
        
        user = get_user_by_email(email, db)
        if not user:
            logger.warning(
                f"Authentication failed: User not found in database | "
                f"Email: {email} | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'} | "
                f"Tenant-ID: {tenant_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"User not found: No user exists with email {email}"
            )

        if not getattr(user, "isActive", True):
            logger.warning(
                f"Authentication failed: User account is disabled | "
                f"Email: {email} | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'} | "
                f"Tenant-ID: {tenant_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account is disabled: User {email} has been deactivated"
            )
        
        logger.debug(
            f"User authenticated successfully | "
            f"User ID: {user.id} | "
            f"Email: {email} | "
            f"URL: {request.url.path} | "
            f"Tenant-ID: {tenant_id}"
        )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Authentication error: Unexpected exception | "
            f"Error: {str(e)} | "
            f"URL: {request.url.path} | "
            f"Method: {request.method} | "
            f"IP: {request.client.host if request.client else 'unknown'} | "
            f"Tenant-ID: {request.headers.get('X-Tenant-ID', 'missing')}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed due to internal error"
        )

def get_tenant_context(
    request: Request,
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tenant context from header and verify user access"""
    if not x_tenant_id:
        logger.warning(
            f"Tenant context missing: X-Tenant-ID header not provided | "
            f"URL: {request.url.path} | "
            f"Method: {request.method} | "
            f"User ID: {current_user.id} | "
            f"IP: {request.client.host if request.client else 'unknown'}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Tenant-ID header is required"
        )

    logger.debug(
        f"Validating tenant context | "
        f"Tenant ID: {x_tenant_id} | "
        f"User ID: {current_user.id} | "
        f"URL: {request.url.path}"
    )

    tenant = get_tenant_by_id(x_tenant_id, db)
    if not tenant:
        logger.warning(
            f"Tenant not found | "
            f"Tenant ID: {x_tenant_id} | "
            f"User ID: {current_user.id} | "
            f"URL: {request.url.path} | "
            f"Method: {request.method} | "
            f"IP: {request.client.host if request.client else 'unknown'}"
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant not found: No tenant exists with ID {x_tenant_id}"
        )

    user_tenants = get_user_tenants(str(current_user.id), db)
    user_tenant = next((tu for tu in user_tenants if str(tu.tenant_id) == x_tenant_id), None)

    if not user_tenant:
        logger.warning(
            f"Access denied: User not associated with tenant | "
            f"User ID: {current_user.id} | "
            f"Email: {current_user.email} | "
            f"Tenant ID: {x_tenant_id} | "
            f"URL: {request.url.path} | "
            f"Method: {request.method} | "
            f"IP: {request.client.host if request.client else 'unknown'} | "
            f"User's tenants: {[str(t.tenant_id) for t in user_tenants]}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: User {current_user.email} is not associated with tenant {x_tenant_id}"
        )

    user_permissions = RBACService.get_user_permissions(db, str(current_user.id), x_tenant_id)
    user_role = RBACService.get_user_role(db, str(current_user.id), x_tenant_id)
    
    logger.debug(
        f"Tenant context validated | "
        f"Tenant ID: {x_tenant_id} | "
        f"User ID: {current_user.id} | "
        f"Role: {user_role} | "
        f"Permissions count: {len(user_permissions)}"
    )

    plan_type = ""
    state_context = getattr(request.state, "tenant_context", None)
    if state_context and state_context.get("plan_type"):
        plan_type = state_context["plan_type"]
    else:
        subscription = get_subscription_by_tenant(x_tenant_id, db)
        if subscription and subscription.plan:
            plan_type = subscription.plan.planType or ""

    tenant_context = {
        "tenant": tenant,
        "user_role": user_role,
        "permissions": user_permissions,
        "tenant_id": x_tenant_id,
        "is_owner": RBACService.is_owner(db, str(current_user.id), x_tenant_id),
        "plan_type": plan_type,
    }

    _enforce_granular_permission(request, current_user, tenant_context)

    return tenant_context

def can_see_all_tasks(tenant_context: dict) -> bool:
    if not tenant_context:
        return False
    if tenant_context.get("is_owner"):
        return True
    role = tenant_context.get("user_role")
    role_name = getattr(role, "name", None) if role else None
    return bool(role_name and (role_name == "owner" or role_name.endswith("_manager")))

def can_see_all_projects(tenant_context: dict) -> bool:
    return bool(tenant_context and tenant_context.get("is_owner"))

def can_edit_project(tenant_context: dict, project, user_id: str) -> bool:
    if tenant_context and tenant_context.get("is_owner"):
        return True
    uid = str(user_id)
    if project.projectManagerId and str(project.projectManagerId) == uid:
        return True
    if project.createdById and str(project.createdById) == uid:
        return True
    return False

def require_permission(permission: str):
    """Dependency to require specific permission"""
    def permission_checker(
        request: Request,
        current_user = Depends(get_current_user),
        tenant_context = Depends(get_tenant_context),
        db: Session = Depends(get_db)
    ):
        if getattr(current_user, "userRole", None) == "super_admin":
            return current_user

        if not tenant_context:
            logger.warning(
                f"Permission check failed: Tenant context missing | "
                f"Required permission: {permission} | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"User ID: {current_user.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context required: X-Tenant-ID header must be provided"
            )
        
        if tenant_context.get("is_owner"):
            logger.debug(
                f"Permission granted: User is owner | "
                f"Required permission: {permission} | "
                f"User ID: {current_user.id} | "
                f"Tenant ID: {tenant_context.get('tenant_id')}"
            )
            return current_user
        
        user_permissions = tenant_context.get("permissions", [])
        if not permission_satisfied(user_permissions, permission):
            logger.warning(
                f"Permission denied: User lacks required permission | "
                f"Required permission: {permission} | "
                f"User ID: {current_user.id} | "
                f"Email: {current_user.email} | "
                f"Tenant ID: {tenant_context.get('tenant_id')} | "
                f"User role: {tenant_context.get('user_role')} | "
                f"User permissions: {user_permissions} | "
                f"URL: {request.url.path} | "
                f"Method: {request.method} | "
                f"IP: {request.client.host if request.client else 'unknown'}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: '{permission}' permission required. Current role: {tenant_context.get('user_role')}"
            )
        
        logger.debug(
            f"Permission granted | "
            f"Permission: {permission} | "
            f"User ID: {current_user.id} | "
            f"Tenant ID: {tenant_context.get('tenant_id')}"
        )
        
        return current_user
    
    return permission_checker

def require_module_access(module: str):
    """Dependency to require access to a module"""
    def module_checker(
        current_user = Depends(get_current_user),
        tenant_context = Depends(get_tenant_context),
        db: Session = Depends(get_db)
    ):
        if not tenant_context:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context required"
            )
        
        if tenant_context.get("is_owner"):
            return current_user
        
        user_permissions = tenant_context.get("permissions", [])
        module_permissions = [p for p in user_permissions if p.startswith(f"{module}:")]
        if len(module_permissions) == 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access to '{module}' module required"
            )
        
        return current_user
    
    return module_checker

def require_owner_or_permission(permission: str):
    """Dependency to require owner role or specific permission"""
    def checker(
        current_user = Depends(get_current_user),
        tenant_context = Depends(get_tenant_context),
        db: Session = Depends(get_db)
    ):
        if not tenant_context:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context required"
            )
        
        if tenant_context.get("is_owner"):
            return current_user
        
        user_permissions = tenant_context.get("permissions", [])
        if permission not in user_permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Owner role or specific permission required"
            )
        
        return current_user
    
    return checker

def require_super_admin(current_user = Depends(get_current_user)):
    if getattr(current_user, 'userRole', None) != 'super_admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Super admin privileges required.'
        )
    return current_user

def require_tenant_admin_or_super_admin(
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    if getattr(current_user, 'userRole', None) == 'super_admin':
        return current_user
    
    if tenant_context and tenant_context.get('is_owner'):
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail='Owner role required.'
    )