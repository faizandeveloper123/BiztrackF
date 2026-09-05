import asyncio
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import logging
from datetime import datetime, timedelta
import json

from ..config.database import (
    get_db, get_tenant_by_id, get_subscription_by_tenant,
    get_tenant_users, get_user_by_email
)
from ..api.dependencies import get_current_user
from .plan_types import is_agency_plan

logger = logging.getLogger(__name__)

AGENCY_POS_ALLOWED_PREFIXES = ("/pos/products", "/pos/categories")

class TenantMiddleware:
    def __init__(self):
        self.tenant_cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = 300  # 5 minutes cache
        
    async def __call__(self, request: Request, call_next):
        # Skip tenant validation for non-tenant endpoints
        if self._should_skip_tenant_validation(request):
            return await call_next(request)
        
        try:
            # Extract tenant ID from header or JWT token
            tenant_id = await self._extract_tenant_id(request)
            
            # Validate tenant and subscription
            tenant_context = await self._validate_tenant_and_subscription(tenant_id, request)
            
            # Add tenant context to request state
            request.state.tenant_context = tenant_context
            
            # Check plan limits
            await self._check_plan_limits(tenant_context, request)
            
            # Process request
            response = await call_next(request)
            
            # Add tenant info to response headers
            response.headers["X-Tenant-ID"] = tenant_id
            response.headers["X-Tenant-Name"] = tenant_context["tenant_name"]
            response.headers["X-Plan-Type"] = tenant_context["plan_type"]
            
            return response
            
        except HTTPException as e:
            logger.warning(f"Tenant validation failed: {e.detail}")
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail, "error_code": "TENANT_VALIDATION_FAILED"}
            )
        except Exception as e:
            logger.error(f"Unexpected error in tenant middleware: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error", "error_code": "TENANT_MIDDLEWARE_ERROR"}
            )
    
    def _should_skip_tenant_validation(self, request: Request) -> bool:
        """Check if tenant validation should be skipped for this endpoint"""
        skip_paths = [
            "/auth/login",
            "/auth/register",
            "/auth/refresh",
            "/auth/select-tenant",
            "/auth/my-tenants",
            "/health",
            "/health/simple",
            "/metrics",
            "/docs",
            "/openapi.json",
            "/tenants/subscribe",
            "/tenants/plans",
            "/tenants/create-tenant",
            "/inventory/health",
            "/subscriptions/webhook",
            "/subscriptions/paypal/webhook",
            "/subscriptions/paypal/confirm",
            "/public/",
            "/crm/leads/email-track/",
            "/crm/leads/twilio/",
            "/"  # Root landing page
        ]
        
        return any(request.url.path.startswith(path) for path in skip_paths)
    
    async def _validate_tenant_and_subscription(self, tenant_id: str, request: Request) -> Dict[str, Any]:
        """Validate tenant exists and has active subscription"""
        # Check cache first
        cache_key = f"tenant_{tenant_id}"
        if cache_key in self.tenant_cache:
            cached_data = self.tenant_cache[cache_key]
            if datetime.utcnow().timestamp() - cached_data["cached_at"] < self.cache_ttl:
                return cached_data["data"]
        
        # Get database session
        db = next(get_db())
        
        try:
            # Validate tenant exists
            tenant = get_tenant_by_id(tenant_id, db)
            if not tenant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tenant not found"
                )
            
            if not tenant.isActive:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Tenant is inactive"
                )
            
            # Get subscription
            subscription = get_subscription_by_tenant(tenant_id, db)
            
            # Testing bypass: when stripe_required is False, skip Stripe/subscription
            # enforcement so users can log in with just credentials.
            stripe_required = getattr(tenant, "stripe_required", True)
            
            if stripe_required:
                if not subscription:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No active subscription found"
                    )
                
                # Check subscription status
                if subscription.status not in ["active", "trial"]:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Subscription is {subscription.status}"
                    )
                
                # Check if subscription is expired
                if subscription.endDate and subscription.endDate < datetime.utcnow():
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Subscription has expired"
                    )
            
            # Get plan details (used for plan limits & features). If no subscription
            # exists (testing mode), fall back to an unrestricted plan context.
            plan = subscription.plan if subscription else None
            if not plan:
                # Default permissive plan for testing bypass
                plan_type = "workshop"
                plan_name = "Testing Mode"
                max_projects = 10000
                max_users = 10000
                features = [
                    "crm", "hrm", "inventory", "sales", "invoices", "projects",
                    "pos", "ledger", "healthcare", "ngo", "workshop", "banking",
                    "investments", "reports", "documents",
                ]
                subscription_status = "active"
                subscription_id = None
            else:
                plan_type = plan.planType
                plan_name = plan.name
                max_projects = plan.maxProjects
                max_users = plan.maxUsers
                features = plan.features or []
                subscription_status = subscription.status
                subscription_id = str(subscription.id)
            
            # Build tenant context
            tenant_context = {
                "tenant_id": tenant_id,
                "tenant_name": tenant.name,
                "tenant_domain": tenant.domain,
                "subscription_id": subscription_id,
                "plan_id": str(plan.id) if plan else None,
                "plan_type": plan_type,
                "plan_name": plan_name,
                "max_projects": max_projects,
                "max_users": max_users,
                "features": features,
                "subscription_status": subscription_status,
                "trial_ends": subscription.endDate if (subscription and subscription.status == "trial") else None,
                "auto_renew": subscription.autoRenew if subscription else True,
                "stripe_required": stripe_required,
            }
            
            # Cache the result
            self.tenant_cache[cache_key] = {
                "data": tenant_context,
                "cached_at": datetime.utcnow().timestamp()
            }
            
            return tenant_context
            
        finally:
            db.close()
    
    async def _extract_tenant_id(self, request: Request) -> str:
        """Extract tenant ID from either header or JWT token"""
        # First try to get from header
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            return tenant_id
        
        # If no header, try to extract from JWT token
        try:
            from ..core.auth import verify_token
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = verify_token(token, "access")
                tenant_id = payload.get("tenant_id")
                if tenant_id:
                    return tenant_id
        except Exception:
            pass
        
        # If neither header nor token has tenant_id, raise error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Tenant-ID header or tenant-specific JWT token is required"
        )
    
    async def _check_plan_limits(self, tenant_context: Dict[str, Any], request: Request):
        """Check if request exceeds plan limits"""
        # Skip limit checking for certain endpoints
        if self._should_skip_limit_checking(request):
            return
        
        db = next(get_db())
        
        try:
            # Check user count limit
            if tenant_context.get("max_users"):
                current_users = len(get_tenant_users(tenant_context["tenant_id"], db))
                if current_users >= tenant_context["max_users"]:
                    # Allow read operations but block user creation
                    path = request.url.path
                    is_user_creation = (
                        request.method in ["POST", "PUT", "PATCH"]
                        and (
                            "/users" in path
                            or path in ("/rbac/tenant-users", "/rbac/create-user")
                            or path.startswith("/rbac/tenant-users")
                            or path.startswith("/rbac/create-user")
                        )
                    )
                    if is_user_creation:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"User limit reached ({current_users}/{tenant_context['max_users']}). Please upgrade your plan."
                        )
            
            # Check project count limit
            if tenant_context.get("max_projects"):
                from ..config.database import get_all_projects
                current_projects = len(get_all_projects(db, tenant_id=tenant_context["tenant_id"]))
                if current_projects >= tenant_context["max_projects"]:
                    # Allow read operations but block project creation
                    if request.method in ["POST", "PUT", "PATCH"] and "/projects" in request.url.path:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail=f"Project limit reached ({current_projects}/{tenant_context['max_projects']}). Please upgrade your plan."
                        )
            
            # Check feature access
            if request.url.path.startswith("/crm") and "crm" not in tenant_context.get("features", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="CRM feature not available in your current plan"
                )
            
            if request.url.path.startswith("/hrm") and "hrm" not in tenant_context.get("features", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="HRM feature not available in your current plan"
                )
            
            if request.url.path.startswith("/inventory") and "inventory" not in tenant_context.get("features", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Inventory feature not available in your current plan"
                )

            if is_agency_plan(tenant_context.get("plan_type")):
                path = request.url.path
                if path.startswith("/pos") and not any(
                    path.startswith(prefix) for prefix in AGENCY_POS_ALLOWED_PREFIXES
                ):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="POS is not available on the Agency plan",
                    )
                
        finally:
            db.close()
    
    def _should_skip_limit_checking(self, request: Request) -> bool:
        """Check if limit checking should be skipped for this request"""
        skip_paths = [
            "/auth",
            "/health",
            "/docs",
            "/openapi.json",
            "/subscriptions/webhook",
            "/subscriptions/paypal/webhook",
            "/subscriptions/paypal/confirm",
        ]
        
        return any(request.url.path.startswith(path) for path in skip_paths)

# Global tenant middleware instance
tenant_middleware = TenantMiddleware()

# Dependency to get tenant context
async def get_tenant_context_from_request(request: Request) -> Dict[str, Any]:
    """Get tenant context from request state"""
    if not hasattr(request.state, 'tenant_context'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context not available"
        )
    return request.state.tenant_context

# Enhanced dependency that includes tenant context
async def get_tenant_user_context(
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context_from_request)
):
    """Get current user with tenant context"""
    return {
        "user": current_user,
        "tenant_context": tenant_context
    }
