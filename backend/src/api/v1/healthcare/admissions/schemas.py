from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date

from .....models.healthcare.enums import AdmissionStatus


class AdmissionBase(BaseModel):
    patient_id: str
    doctor_id: str
    admit_date: date
    discharge_date: Optional[date] = None
    status: str = AdmissionStatus.ADMITTED.value
    ward: str
    room_or_bed: Optional[str] = None
    diagnosis: Optional[str] = None
    notes: Optional[str] = None


class AdmissionCreate(AdmissionBase):
    status: str = AdmissionStatus.ADMITTED.value


class AdmissionUpdate(BaseModel):
    doctor_id: Optional[str] = None
    discharge_date: Optional[date] = None
    status: Optional[str] = None
    ward: Optional[str] = None
    room_or_bed: Optional[str] = None
    diagnosis: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class Admission(AdmissionBase):
    id: str
    tenant_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    patient_name: Optional[str] = None
    doctor_first_name: Optional[str] = None
    doctor_last_name: Optional[str] = None

    class Config:
        from_attributes = True


class AdmissionsResponse(BaseModel):
    admissions: List[Admission]
    total: int


class AdmissionInvoiceSummary(BaseModel):
    id: str
    invoice_number: str
    order_number: Optional[str] = None
    customer_name: str
    total: float
    total_paid: float
    balance: float
    status: str

    class Config:
        from_attributes = True


class AdmissionInvoicesResponse(BaseModel):
    invoices: List[AdmissionInvoiceSummary]
    total: int
