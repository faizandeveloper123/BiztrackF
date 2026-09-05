from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class PatientBase(BaseModel):
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class Patient(PatientBase):
    id: str
    tenant_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class PatientsResponse(BaseModel):
    patients: List[Patient]
    total: int


class PatientHistoryResponse(BaseModel):
    patient: Patient
    appointments: List[Appointment]
    prescriptions: List[Prescription]


from ..appointments.schemas import Appointment
from ..prescriptions.schemas import Prescription

PatientHistoryResponse.model_rebuild()
