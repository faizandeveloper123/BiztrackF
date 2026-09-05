from __future__ import annotations

import sys
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID

from .....models.labeled_contact_items import LabeledEmailItem, LabeledPhoneItem
from .....models.crm.enums import (
    LeadStatus,
    LeadSource,
    OpportunityStage,
    ContactType,
    ActivityType,
    CompanySize,
    QuoteStatus,
    ContractStatus,
    Industry,
)
from .....models.common import Pagination

class CompanyBase(BaseModel):
    name: str
    industry: Optional[Industry] = None
    size: Optional[CompanySize] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    isActive: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[Industry] = None
    size: Optional[CompanySize] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    isActive: Optional[bool] = None

class Company(CompanyBase):
    id: str
    tenant_id: str
    createdBy: Optional[str] = None
    annualRevenue: Optional[float] = None
    employeeCount: Optional[int] = None
    foundedYear: Optional[int] = None
    contacts: List[Contact] = []
    opportunities: List[Any] = []
    createdAt: datetime
    updatedAt: datetime

    @field_validator("id", "tenant_id", mode="before")
    @classmethod
    def coerce_uuid_to_str(cls, v):
        if v is None:
            return v
        return str(v) if hasattr(v, "hex") else v

    @field_validator("opportunities", mode="before")
    @classmethod
    def opportunities_orm_to_dicts(cls, v: Any) -> Any:
        if v is None or not v:
            return []
        from ..opportunities.schemas import Opportunity as Oppo
        out = []
        for item in v:
            if isinstance(item, dict):
                out.append(item)
            elif hasattr(item, "_sa_instance_state"):
                out.append(Oppo.model_validate(item).model_dump())
            else:
                out.append(item)
        return out

    class Config:
        from_attributes = True

from ..contacts.schemas import Contact
from ..opportunities.schemas import Opportunity
Company.model_rebuild()

class CompaniesResponse(BaseModel):
    companies: List[Company]
    pagination: Pagination


class CRMCompaniesResponse(BaseModel):
    companies: List[Company]
    pagination: Pagination
