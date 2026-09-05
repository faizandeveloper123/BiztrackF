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

class SalesActivityBase(BaseModel):
    type: ActivityType
    subject: str
    description: Optional[str] = None
    dueDate: Optional[datetime] = None
    completed: bool = False
    notes: Optional[str] = None

class SalesActivityCreate(SalesActivityBase):
    leadId: Optional[str] = None
    opportunityId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None

class SalesActivityUpdate(BaseModel):
    type: Optional[ActivityType] = None
    subject: Optional[str] = None
    description: Optional[str] = None
    dueDate: Optional[datetime] = None
    completed: Optional[bool] = None
    notes: Optional[str] = None

class SalesActivity(SalesActivityBase):
    id: str
    leadId: Optional[str] = None
    opportunityId: Optional[str] = None
    contactId: Optional[str] = None
    companyId: Optional[str] = None
    tenant_id: str
    createdBy: str
    assignedTo: Optional[str] = None
    completedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class SalesActivitiesResponse(BaseModel):
    activities: List[SalesActivity]
    pagination: Pagination


class CRMActivitiesResponse(BaseModel):
    activities: List[SalesActivity]
    pagination: Pagination


class SalesMetrics(BaseModel):
    totalLeads: int
    activeLeads: int
    totalOpportunities: int
    openOpportunities: int
    totalRevenue: float
    projectedRevenue: float
    conversionRate: float
    averageDealSize: float

class SalesPipeline(BaseModel):
    stage: str
    count: int
    value: float
    probability: float

class SalesDashboard(BaseModel):
    metrics: SalesMetrics
    pipeline: List[SalesPipeline]
    recentActivities: List[SalesActivity]
    topOpportunities: List[Any]
