from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from .....models.ngo.enums import PartnerSector, PartnerSize, PartnerStatus


class PartnerOrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    sector: str = Field(default=PartnerSector.RELIEF.value)
    organization_size: str = Field(default=PartnerSize.MEDIUM.value)
    website: Optional[str] = Field(None, max_length=512)
    location: Optional[str] = Field(None, max_length=512)
    status: str = Field(default=PartnerStatus.ACTIVE.value)

    @field_validator("sector")
    @classmethod
    def validate_sector(cls, v: str) -> str:
        key = (v or PartnerSector.RELIEF.value).strip().lower()
        allowed = {item.value for item in PartnerSector}
        if key not in allowed:
            raise ValueError(f"sector must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("organization_size")
    @classmethod
    def validate_size(cls, v: str) -> str:
        key = (v or PartnerSize.MEDIUM.value).strip().lower()
        allowed = {item.value for item in PartnerSize}
        if key not in allowed:
            raise ValueError(f"organization_size must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        key = (v or PartnerStatus.ACTIVE.value).strip().lower()
        allowed = {item.value for item in PartnerStatus}
        if key not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return (v or "").strip().lower()


class PartnerOrganizationCreate(PartnerOrganizationBase):
    pass


class PartnerOrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, min_length=3, max_length=255)
    sector: Optional[str] = None
    organization_size: Optional[str] = None
    website: Optional[str] = Field(None, max_length=512)
    location: Optional[str] = Field(None, max_length=512)
    status: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("sector")
    @classmethod
    def validate_sector(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower()
        allowed = {item.value for item in PartnerSector}
        if key not in allowed:
            raise ValueError(f"sector must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("organization_size")
    @classmethod
    def validate_size(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower()
        allowed = {item.value for item in PartnerSize}
        if key not in allowed:
            raise ValueError(f"organization_size must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower()
        allowed = {item.value for item in PartnerStatus}
        if key not in allowed:
            raise ValueError(f"status must be one of: {', '.join(sorted(allowed))}")
        return key

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.strip().lower()


class PartnerOrganization(PartnerOrganizationBase):
    id: str
    tenant_id: str
    partner_code: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class PartnerOrganizationsResponse(BaseModel):
    organizations: List[PartnerOrganization]
    total: int
