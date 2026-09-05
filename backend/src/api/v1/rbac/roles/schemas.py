from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from .....models.common import Pagination


class RoleBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    permissions: List[str] = []
    isActive: bool = True


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None
    isActive: Optional[bool] = None


class Role(RoleBase):
    id: str
    tenant_id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class RolesResponse(BaseModel):
    roles: List[Role]
    pagination: Pagination
