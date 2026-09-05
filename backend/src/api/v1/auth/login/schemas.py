from typing import List

from pydantic import BaseModel, EmailStr

from ..tenants.schemas import TenantInfo
from ..users.schemas import UserResponse


class LoginCredentials(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    success: bool
    user: UserResponse
    token: str
    refresh_token: str
    expires_in: int
    available_tenants: List[TenantInfo] = []
    requires_tenant_selection: bool = False
