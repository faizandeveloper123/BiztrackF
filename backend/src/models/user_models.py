from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from .platform.enums import (
    UserRole,
    TenantRole,
    SubscriptionStatus,
    PlanType,
    PlanFeature,
)
from .common import Pagination

class Permission(BaseModel):
    code: str
    label: str

class CustomRoleBase(BaseModel):
    tenant_id: str
    name: str
    permissions: List[str]

class CustomRoleCreate(CustomRoleBase):
    pass

class CustomRoleUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[List[str]] = None

class CustomRole(CustomRoleBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    userName: str
    email: EmailStr
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    userRole: UserRole = UserRole.TEAM_MEMBER
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    userName: Optional[str] = None
    email: Optional[EmailStr] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    userRole: Optional[UserRole] = None
    avatar: Optional[str] = None

class User(UserBase):
    userId: str
    isActive: bool = True
    permissions: List[str] = []
    tenantLogoUrl: Optional[str] = None

    class Config:
        from_attributes = True

class TeamMember(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar: Optional[str] = None

class LoginCredentials(BaseModel):
    email: EmailStr
    password: str

class TenantInfo(BaseModel):
    id: str
    name: str
    domain: Optional[str] = None
    role: str
    isActive: bool = True

class AuthResponse(BaseModel):
    success: bool
    user: User
    token: str
    refresh_token: str
    expires_in: int
    available_tenants: List[TenantInfo] = []
    requires_tenant_selection: bool = False

class TenantSelectionRequest(BaseModel):
    tenant_id: str

class TenantSelectionResponse(BaseModel):
    success: bool
    message: str
    tenant: TenantInfo
    access_token: str
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    expires_in: int

class PlanUpgradeRequest(BaseModel):
    tenant_id: str
    old_plan_id: Optional[str] = None
    new_plan_id: str

class UsageSummary(BaseModel):
    tenant_id: str
    plan_type: str
    subscription_status: str
    trial_ends: Optional[datetime] = None
    usage: Dict[str, Any]
    limits: Dict[str, Any]
    usage_percentages: Dict[str, float]
    last_updated: str

class PlanLimits(BaseModel):
    max_users: Optional[int] = None
    max_projects: Optional[int] = None
    max_storage_mb: Optional[int] = None
    features: List[str] = []

class PlanBase(BaseModel):
    name: str
    description: str
    planType: str
    price: float
    billingCycle: str
    maxProjects: Optional[int] = None
    maxUsers: Optional[int] = None
    features: List[str]
    isActive: bool = True

class Plan(PlanBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    billingCycle: Optional[str] = None
    maxProjects: Optional[int] = None
    maxUsers: Optional[int] = None
    features: Optional[List[str]] = None
    isActive: Optional[bool] = None

    class Config:
        from_attributes = True

class TenantBase(BaseModel):
    name: str
    domain: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[Dict[str, Any]] = {}

class TenantCreate(TenantBase):
    planId: str
    ownerEmail: EmailStr

class Tenant(TenantBase):
    id: str
    isActive: bool = True
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class SubscriptionBase(BaseModel):
    tenant_id: str
    planId: str
    status: SubscriptionStatus = SubscriptionStatus.TRIAL
    startDate: datetime
    endDate: Optional[datetime] = None
    autoRenew: bool = True

class SubscriptionCreate(SubscriptionBase):
    pass

class Subscription(SubscriptionBase):
    id: str
    createdAt: datetime
    updatedAt: datetime
    plan: Plan

    class Config:
        from_attributes = True

from .rbac_models import (
    Role,
    RoleBase,
    RoleCreate,
    RoleUpdate,
    RolesResponse,
    TenantUser,
    TenantUserBase,
    TenantUserCreate,
    TenantUserUpdate,
    TenantUsersResponse,
    UserWithPermissions,
)

class UsersResponse(BaseModel):
    users: List[User]

class PlansResponse(BaseModel):
    plans: List[Plan]

class TenantsResponse(BaseModel):
    tenants: List[Tenant]
    pagination: Pagination

class SubscribeRequest(BaseModel):
    planId: str
    tenantName: str
    domain: Optional[str] = None
    paymentMethod: Optional[str] = "stripe"
    testingMode: Optional[bool] = False
    stripeRequired: Optional[bool] = None

