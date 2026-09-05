from typing import List, Optional

from pydantic import BaseModel


class TenantInfo(BaseModel):
    id: str
    name: str
    domain: Optional[str] = None
    role: str
    isActive: bool = True


class TenantSelectionRequest(BaseModel):
    tenant_id: str


class TenantSelectionResponse(BaseModel):
    success: bool
    message: str
    tenant: TenantInfo
    access_token: str
    expires_in: int


class MyTenantsResponse(BaseModel):
    success: bool
    tenants: List[TenantInfo]
    total: int
