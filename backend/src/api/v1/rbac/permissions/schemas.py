from typing import List, Optional

from pydantic import BaseModel


class RoleSummary(BaseModel):
    name: str
    display_name: str


class UserPermissionsResponse(BaseModel):
    permissions: List[str]
    accessible_modules: List[str]
    is_owner: bool
    role: Optional[RoleSummary] = None


class CheckPermissionResponse(BaseModel):
    permission: str
    has_permission: bool
