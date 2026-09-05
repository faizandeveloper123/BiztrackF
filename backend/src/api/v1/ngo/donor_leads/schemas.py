from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from .....models.ngo.enums import DonorLeadStatus, DonorLeadSource


class DonorLeadBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    organization: Optional[str] = Field(None, max_length=255)
    expected_donation: float = Field(default=0, ge=0)
    status: str = Field(default=DonorLeadStatus.NEW.value)
    source: str = Field(default=DonorLeadSource.OTHER.value)
    assigned_to: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        key = (v or DonorLeadStatus.NEW.value).strip().lower()
        allowed = {item.value for item in DonorLeadStatus}
        if key not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        key = (v or DonorLeadSource.OTHER.value).strip().lower().replace(" ", "_")
        if key == "socialmedia":
            key = DonorLeadSource.SOCIAL_MEDIA.value
        allowed = {item.value for item in DonorLeadSource}
        if key not in allowed:
            raise ValueError(f"source must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return (v or "").strip().lower()


class DonorLeadCreate(DonorLeadBase):
    pass


class DonorLeadUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, min_length=3, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    organization: Optional[str] = Field(None, max_length=255)
    expected_donation: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None
    source: Optional[str] = None
    assigned_to: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower()
        allowed = {item.value for item in DonorLeadStatus}
        if key not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower().replace(" ", "_")
        if key == "socialmedia":
            key = DonorLeadSource.SOCIAL_MEDIA.value
        allowed = {item.value for item in DonorLeadSource}
        if key not in allowed:
            raise ValueError(f"source must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.strip().lower()


class DonorLead(DonorLeadBase):
    id: str
    tenant_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class DonorLeadsResponse(BaseModel):
    leads: List[DonorLead]
    total: int
