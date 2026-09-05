from typing import Optional

from pydantic import BaseModel


class EmployeeProfileUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    emergencyPhone: Optional[str] = None
    avatar: Optional[str] = None
