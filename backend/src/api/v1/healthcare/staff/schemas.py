from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class HealthcareStaffBase(BaseModel):
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    permissions: List[str] = []


class HealthcareStaffCreate(HealthcareStaffBase):
    password: str


class HealthcareStaffUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class HealthcareStaff(HealthcareStaffBase):
    id: str
    tenant_id: str
    user_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class HealthcareStaffResponse(BaseModel):
    staff: List[HealthcareStaff]
    total: int
