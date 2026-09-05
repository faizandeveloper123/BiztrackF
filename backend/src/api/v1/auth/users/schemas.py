from typing import Optional, List

from pydantic import BaseModel, EmailStr

from .....models.platform.enums import UserRole


class UserUpdate(BaseModel):
    userName: Optional[str] = None
    email: Optional[EmailStr] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    userRole: Optional[UserRole] = None
    avatar: Optional[str] = None


class UserResponse(BaseModel):
    userId: str
    userName: str
    email: EmailStr
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    userRole: UserRole = UserRole.TEAM_MEMBER
    avatar: Optional[str] = None
    isActive: bool = True
    permissions: List[str] = []
    tenantLogoUrl: Optional[str] = None

    class Config:
        from_attributes = True
