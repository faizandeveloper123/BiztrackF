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

class QuoteItem(BaseModel):
    description: str
    quantity: int = 1
    unitPrice: float
    discount: float = 0.0
    total: float

class QuoteBase(BaseModel):
    title: str
    description: Optional[str] = None
    opportunityId: str
    validUntil: Union[datetime, str]
    terms: Optional[str] = None
    notes: Optional[str] = None
    items: List[QuoteItem] = []
    subtotal: float = 0.0
    taxRate: float = 0.0
    taxAmount: float = 0.0
    total: float = 0.0

class QuoteCreate(QuoteBase):
    pass

class QuoteUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    validUntil: Optional[Union[datetime, str]] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[QuoteItem]] = None
    subtotal: Optional[float] = None
    taxRate: Optional[float] = None
    taxAmount: Optional[float] = None
    total: Optional[float] = None

class Quote(QuoteBase):
    id: UUID
    quoteNumber: str
    status: QuoteStatus = QuoteStatus.DRAFT
    tenant_id: UUID
    createdBy: UUID
    sentAt: Optional[datetime] = None
    viewedAt: Optional[datetime] = None
    acceptedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class ContractBase(BaseModel):
    title: str
    description: Optional[str] = None
    opportunityId: str
    startDate: Union[datetime, str]
    endDate: Union[datetime, str]
    value: float
    terms: Optional[str] = None
    notes: Optional[str] = None
    autoRenew: bool = False
    renewalTerms: Optional[str] = None
    contactId: Optional[UUID] = None
    companyId: Optional[UUID] = None

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    startDate: Optional[Union[datetime, str]] = None
    endDate: Optional[Union[datetime, str]] = None
    value: Optional[float] = None
    terms: Optional[str] = None
    notes: Optional[str] = None
    autoRenew: Optional[bool] = None
    renewalTerms: Optional[str] = None
    contactId: Optional[UUID] = None
    companyId: Optional[UUID] = None

class Contract(ContractBase):
    id: UUID
    contractNumber: str
    status: ContractStatus = ContractStatus.DRAFT
    tenant_id: UUID
    createdBy: UUID
    signedAt: Optional[datetime] = None
    activatedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    contactName: Optional[str] = None
    companyName: Optional[str] = None

    class Config:
        from_attributes = True


class QuotesResponse(BaseModel):
    quotes: List[Quote]
    pagination: Pagination

class ContractsResponse(BaseModel):
    contracts: List[Contract]
    pagination: Pagination
