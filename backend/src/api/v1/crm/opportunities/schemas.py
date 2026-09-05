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

class OpportunityBase(BaseModel):
    title: str
    description: Optional[str] = None
    stage: OpportunityStage = OpportunityStage.PROSPECTING
    amount: Optional[float] = None
    probability: int = 50
    expectedCloseDate: Optional[datetime] = None
    leadSource: Optional[LeadSource] = LeadSource.WEBSITE
    leadId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []

    @field_validator("title", mode="before")
    @classmethod
    def validate_title(cls, v):
        if v is None:
            raise ValueError("Title is required")
        text = str(v).strip()
        if not text:
            raise ValueError("Title is required")
        return text

    @field_validator("probability")
    @classmethod
    def validate_probability(cls, v):
        if v < 0 or v > 100:
            raise ValueError("Probability must be between 0 and 100")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v is None:
            return v
        if v < 0:
            raise ValueError("Amount cannot be negative")
        return v

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[OpportunityStage] = None
    amount: Optional[float] = None
    probability: Optional[int] = None
    expectedCloseDate: Optional[datetime] = None
    leadSource: Optional[LeadSource] = None
    leadId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

    @field_validator("title", mode="before")
    @classmethod
    def validate_title(cls, v):
        if v is None:
            return v
        text = str(v).strip()
        if not text:
            raise ValueError("Title cannot be empty")
        return text

    @field_validator("probability")
    @classmethod
    def validate_probability(cls, v):
        if v is None:
            return v
        if v < 0 or v > 100:
            raise ValueError("Probability must be between 0 and 100")
        return v

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if v is None:
            return v
        if v < 0:
            raise ValueError("Amount cannot be negative")
        return v

class Opportunity(OpportunityBase):
    id: str
    tenant_id: str
    createdBy: str
    assignedToUser: Optional[Dict[str, str]] = None
    closedDate: Optional[datetime] = None
    wonAmount: Optional[float] = None
    lostReason: Optional[str] = None
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    @field_validator("id", "tenant_id", mode="before")
    @classmethod
    def coerce_uuid_to_str(cls, v):
        if v is None:
            return v
        return str(v) if hasattr(v, "hex") else v

    @field_validator("createdBy", "assignedTo", mode="before")
    @classmethod
    def coerce_user_to_id(cls, v):
        if v is None:
            return None
        if hasattr(v, "id"):
            return str(v.id)
        return str(v)

    @field_validator("leadId", "contactId", "companyId", mode="before")
    @classmethod
    def coerce_related_ids(cls, v):
        if v is None:
            return None
        if hasattr(v, "hex"):
            return str(v)
        return str(v)

    @field_validator("leadSource", mode="before")
    @classmethod
    def empty_lead_source(cls, v):
        if v is None or v == "":
            return None
        return v

    class Config:
        from_attributes = True


class OpportunitiesResponse(BaseModel):
    opportunities: List[Opportunity]
    pagination: Pagination


class CRMOpportunitiesResponse(BaseModel):
    opportunities: List[Opportunity]
    pagination: Pagination
