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

from ..leads.schemas import Lead
from ..activities.schemas import SalesActivity
from ..opportunities.schemas import Opportunity

class CRMMetrics(BaseModel):
    totalLeads: int
    activeLeads: int
    totalContacts: int
    totalCompanies: int
    totalOpportunities: int
    openOpportunities: int
    totalRevenue: float
    projectedRevenue: float
    conversionRate: float
    averageDealSize: float

class CRMPipeline(BaseModel):
    stage: str
    count: int
    value: float
    probability: float

class CRMDashboard(BaseModel):
    metrics: CRMMetrics
    pipeline: List[CRMPipeline]
    recentActivities: List[SalesActivity]
    topOpportunities: List[Opportunity]
    recentLeads: List['Lead']
