from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from .....models.healthcare.enums import AppointmentStatus


class AppointmentBase(BaseModel):
    doctor_id: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    appointment_date: date
    start_time: str
    end_time: str
    status: str = AppointmentStatus.SCHEDULED.value
    notes: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    doctor_id: Optional[str] = None
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    appointment_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class Appointment(AppointmentBase):
    id: str
    tenant_id: str
    patient_id: Optional[str] = None
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    doctor_first_name: Optional[str] = None
    doctor_last_name: Optional[str] = None

    class Config:
        from_attributes = True


class AppointmentsResponse(BaseModel):
    appointments: List[Appointment]
    total: int


class AppointmentInvoiceLineItem(BaseModel):
    description: str
    amount: float


class AppointmentInvoiceCreate(BaseModel):
    line_items: List[AppointmentInvoiceLineItem]
