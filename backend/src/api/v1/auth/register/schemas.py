from typing import Optional

from pydantic import BaseModel, EmailStr

from .....models.platform.enums import UserRole


class RegisterRequest(BaseModel):
    userName: str
    email: EmailStr
    password: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    userRole: UserRole = UserRole.TEAM_MEMBER
    avatar: Optional[str] = None
