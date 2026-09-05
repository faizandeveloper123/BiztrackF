from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from .....models.ngo.enums import DonorType, DonorStatus


class DonorBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    organization: Optional[str] = Field(None, max_length=255)
    donor_type: str = Field(default=DonorType.INDIVIDUAL.value)
    status: str = Field(default=DonorStatus.ACTIVE.value)
    address: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("donor_type")
    @classmethod
    def validate_donor_type(cls, v: str) -> str:
        key = (v or DonorType.INDIVIDUAL.value).strip().lower()
        allowed = {item.value for item in DonorType}
        if key not in allowed:
            raise ValueError(f"donor_type must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        key = (v or DonorStatus.ACTIVE.value).strip().lower()
        allowed = {item.value for item in DonorStatus}
        if key not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return (v or "").strip().lower()


class DonorCreate(DonorBase):
    total_donated: Optional[float] = Field(default=0, ge=0)


class DonorUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, min_length=3, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    organization: Optional[str] = Field(None, max_length=255)
    donor_type: Optional[str] = None
    status: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    total_donated: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None

    @field_validator("donor_type")
    @classmethod
    def validate_donor_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower()
        allowed = {item.value for item in DonorType}
        if key not in allowed:
            raise ValueError(f"donor_type must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower()
        allowed = {item.value for item in DonorStatus}
        if key not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.strip().lower()


class Donor(DonorBase):
    id: str
    tenant_id: str
    donor_code: str
    total_donated: float = 0
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class DonorsResponse(BaseModel):
    donors: List[Donor]
    total: int
