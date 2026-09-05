from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime, date


class PrescriptionItem(BaseModel):
    type: Literal["medicine", "vitals", "test"] = "medicine"
    medicine_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    vital_name: Optional[str] = None
    vital_value: Optional[str] = None
    vital_unit: Optional[str] = None
    test_name: Optional[str] = None
    test_instructions: Optional[str] = None


class PrescriptionBase(BaseModel):
    appointment_id: str
    doctor_id: str
    patient_name: str
    patient_phone: Optional[str] = None
    prescription_date: date
    notes: Optional[str] = None
    items: List[PrescriptionItem] = []


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionUpdate(BaseModel):
    doctor_id: Optional[str] = None
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    prescription_date: Optional[date] = None
    notes: Optional[str] = None
    items: Optional[List[PrescriptionItem]] = None


class Prescription(PrescriptionBase):
    id: str
    tenant_id: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
    doctor_first_name: Optional[str] = None
    doctor_last_name: Optional[str] = None
    appointment_date: Optional[str] = None

    class Config:
        from_attributes = True


class PrescriptionsResponse(BaseModel):
    prescriptions: List[Prescription]
    total: int
