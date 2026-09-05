from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from .....models.common import Pagination
from ..roles.schemas import Role


class TenantUserBase(BaseModel):
    tenant_id: str
    userId: str
    role_id: str
    custom_permissions: Optional[List[str]] = []
    isActive: bool = True


class TenantUserCreate(TenantUserBase):
    pass


class TenantUserUpdate(BaseModel):
    role_id: Optional[str] = None
    custom_permissions: Optional[List[str]] = None
    isActive: Optional[bool] = None


class UserSummary(BaseModel):
    id: str
    userName: str
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    avatar: Optional[str] = None


class TenantUser(TenantUserBase):
    id: str
    invitedBy: Optional[str] = None
    joinedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    role: Optional[Role] = None
    user: Optional[UserSummary] = None

    class Config:
        from_attributes = True


class TenantUsersResponse(BaseModel):
    users: List[TenantUser]
    pagination: Pagination


class UserWithPermissions(BaseModel):
    id: str
    tenant_user_id: Optional[str] = None
    userName: str
    email: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    avatar: Optional[str] = None
    isActive: bool
    role: Optional[Role] = None
    role_id: Optional[str] = None
    custom_permissions: Optional[List[str]] = []
    permissions: List[str] = []
    joinedAt: Optional[datetime] = None

    class Config:
        from_attributes = True
