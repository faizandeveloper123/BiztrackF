from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DoctorAvailabilitySlot(BaseModel):
    day: str
    start_time: str
    end_time: str


class DoctorBase(BaseModel):
    pmdc_number: str
    phone: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    address: Optional[str] = None
    availability: List[DoctorAvailabilitySlot] = []


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    pmdc_number: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    address: Optional[str] = None
    availability: Optional[List[DoctorAvailabilitySlot]] = None
    is_active: Optional[bool] = None


class Doctor(DoctorBase):
    id: str
    tenant_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class DoctorsResponse(BaseModel):
    doctors: List[Doctor]
    total: int
