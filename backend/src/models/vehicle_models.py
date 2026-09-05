from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class VehicleCreate(BaseModel):
    make: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    year: Optional[str] = None
    color: Optional[str] = None
    vin: Optional[str] = None
    registration_number: str = Field(..., min_length=1)
    mileage: Optional[str] = None
    engine_number: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("make", "model", "registration_number")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("This field is required")
        return cleaned


class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    color: Optional[str] = None
    vin: Optional[str] = None
    registration_number: Optional[str] = None
    mileage: Optional[str] = None
    engine_number: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class VehicleResponse(BaseModel):
    id: str
    tenant_id: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    color: Optional[str] = None
    vin: Optional[str] = None
    registration_number: Optional[str] = None
    mileage: Optional[str] = None
    engine_number: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
