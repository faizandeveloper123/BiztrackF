from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from .....models.crm.enums import LeadStatus, LeadSource, LeadPipelineStage, LeadRating
from .....models.common import Pagination

STATUS_MAP = {
    "converted": LeadStatus.WON.value,
    "proposal": LeadStatus.PROPOSAL_SENT.value,
    "closed": LeadStatus.CLOSED.value,
}

PIPELINE_FROM_STATUS = {
    "new": "new_lead",
    "contacted": "tried_to_contact",
    "qualified": "qualified",
    "proposal_sent": "made_contact",
    "proposal": "made_contact",
    "negotiation": "made_contact",
    "won": "closed",
    "converted": "closed",
    "closed": "closed",
    "lost": "lost",
    "open": "new_lead",
}


class LeadBase(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: Optional[str] = LeadSource.WEBSITE.value
    status: Optional[str] = "open"
    priority: Optional[str] = "medium"
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    estimatedValue: Optional[float] = None
    expectedCloseDate: Optional[str] = None
    score: int = 0
    budget: Optional[float] = None
    timeline: Optional[str] = None
    pipelineStage: Optional[str] = LeadPipelineStage.NEW_LEAD.value
    leadRating: Optional[str] = None
    leadType: Optional[str] = None
    priceMin: Optional[float] = None
    priceMax: Optional[float] = None
    buyIntent: Optional[str] = None
    sellIntent: Optional[str] = None
    houseToSell: Optional[str] = None
    buyingIn: Optional[str] = None
    sellingIn: Optional[str] = None
    mortgageType: Optional[str] = None
    ownsRents: Optional[str] = None
    workPhone: Optional[str] = None
    homePhone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    ipAddress: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    mainAgentId: Optional[str] = None
    listAgentId: Optional[str] = None
    mortgageAgentId: Optional[str] = None
    lastContactAt: Optional[datetime] = None
    lastContactChannel: Optional[str] = None
    registeredAt: Optional[datetime] = None
    isPartial: bool = False
    refSource: Optional[str] = None
    campaignSource: Optional[str] = None
    receiveSms: bool = True
    customFields: Dict[str, Any] = {}
    nextFollowUpDate: Optional[datetime] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    estimatedValue: Optional[float] = None
    expectedCloseDate: Optional[str] = None
    score: Optional[int] = None
    budget: Optional[float] = None
    timeline: Optional[str] = None
    pipelineStage: Optional[str] = None
    leadRating: Optional[str] = None
    leadType: Optional[str] = None
    priceMin: Optional[float] = None
    priceMax: Optional[float] = None
    buyIntent: Optional[str] = None
    sellIntent: Optional[str] = None
    houseToSell: Optional[str] = None
    buyingIn: Optional[str] = None
    sellingIn: Optional[str] = None
    mortgageType: Optional[str] = None
    ownsRents: Optional[str] = None
    workPhone: Optional[str] = None
    homePhone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    ipAddress: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    mainAgentId: Optional[str] = None
    listAgentId: Optional[str] = None
    mortgageAgentId: Optional[str] = None
    lastContactAt: Optional[datetime] = None
    lastContactChannel: Optional[str] = None
    registeredAt: Optional[datetime] = None
    isPartial: Optional[bool] = None
    refSource: Optional[str] = None
    campaignSource: Optional[str] = None
    receiveSms: Optional[bool] = None
    customFields: Optional[Dict[str, Any]] = None
    nextFollowUpDate: Optional[datetime] = None


class Lead(LeadBase):
    id: UUID
    tenant_id: UUID
    email: str
    createdBy: Optional[str] = None
    assignedToUser: Optional[Dict[str, str]] = None
    convertedToContact: Optional[str] = None
    convertedToOpportunity: Optional[str] = None
    lastContactDate: Optional[datetime] = None
    activities: List[Dict[str, Any]] = []
    callCount: int = 0
    emailCount: int = 0
    smsCount: int = 0
    lastCallAt: Optional[datetime] = None
    lastEmailAt: Optional[datetime] = None
    lastSmsAt: Optional[datetime] = None
    hasOpenTask: bool = False
    hasFlaggedTask: bool = False
    createdAt: datetime
    updatedAt: datetime

    @model_validator(mode="before")
    @classmethod
    def hydrate_lead_orm(cls, data: Any):
        if data is None or not hasattr(data, "_sa_instance_state"):
            return data
        from sqlalchemy.inspection import inspect as sa_inspect

        out = {}
        for attr in sa_inspect(data).mapper.column_attrs:
            out[attr.key] = getattr(data, attr.key)
        aid = out.pop("assignedToId", None)
        out["assignedTo"] = str(aid) if aid is not None else None
        cid = out.pop("createdById", None)
        out["createdBy"] = str(cid) if cid is not None else None
        for key in ("mainAgentId", "listAgentId", "mortgageAgentId"):
            if out.get(key) is not None:
                out[key] = str(out[key])
        if out.get("tags") is None:
            out["tags"] = []
        if out.get("customFields") is None:
            out["customFields"] = {}
        ls = out.get("leadSource")
        if ls is None or ls == "":
            out["leadSource"] = LeadSource.OTHER.value
        else:
            value = ls.value if hasattr(ls, "value") else str(ls)
            out["leadSource"] = value
        st = out.get("status")
        allowed_statuses = {item.value for item in LeadStatus} | {"open", "closed", "converted"}
        if not st:
            out["status"] = "open"
        else:
            value = st.value if hasattr(st, "value") else str(st)
            if value in allowed_statuses:
                out["status"] = value
            else:
                out["status"] = STATUS_MAP.get(value, "open")
        if not out.get("pipelineStage"):
            out["pipelineStage"] = PIPELINE_FROM_STATUS.get(out.get("status") or "new", "new_lead")
        if out.get("lastContactAt") and not out.get("lastContactDate"):
            out["lastContactDate"] = out["lastContactAt"]
        return out

    @field_validator("assignedTo", "mainAgentId", "listAgentId", "mortgageAgentId", mode="before")
    @classmethod
    def coerce_ids(cls, v):
        if v is None:
            return None
        if hasattr(v, "id"):
            return str(v.id)
        if isinstance(v, str) and not v.strip():
            return None
        return str(v)

    class Config:
        from_attributes = True


class LeadDetail(Lead):
    additionalContacts: List[Dict[str, Any]] = []
    openTask: Optional[Dict[str, Any]] = None
    lastPropertyView: Optional[Dict[str, Any]] = None
    propertyViewSummary: Optional[Dict[str, Any]] = None
    listingSearches: List[Dict[str, Any]] = []
    integrations: Dict[str, Any] = {}


class CRMLeadsResponse(BaseModel):
    leads: List[Lead]
    pagination: Pagination


class LeadsResponse(CRMLeadsResponse):
    pass


class PipelineUpdate(BaseModel):
    pipelineStage: str


class BulkLeadAction(BaseModel):
    leadIds: List[str]
    action: str
    assignedTo: Optional[str] = None
    pipelineStage: Optional[str] = None
    status: Optional[str] = None
    leadRating: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[List[str]] = None


class LeadNoteCreate(BaseModel):
    commType: str = "note"
    callResult: Optional[str] = None
    content: Optional[str] = None
    occurredAt: Optional[datetime] = None


class LeadNoteUpdate(BaseModel):
    commType: Optional[str] = None
    callResult: Optional[str] = None
    content: Optional[str] = None
    occurredAt: Optional[datetime] = None


class LeadNoteOut(BaseModel):
    id: UUID
    leadId: UUID
    commType: str
    callResult: Optional[str] = None
    content: Optional[str] = None
    occurredAt: Optional[datetime] = None
    createdById: Optional[str] = None
    createdByName: Optional[str] = None
    isSystem: bool = False
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadTaskCreate(BaseModel):
    title: str
    details: Optional[str] = None
    assignedToId: Optional[str] = None
    status: str = "not_started"
    priority: str = "normal"
    dueAt: Optional[datetime] = None
    reminder: Optional[str] = None
    flagged: bool = False


class LeadTaskUpdate(BaseModel):
    title: Optional[str] = None
    details: Optional[str] = None
    assignedToId: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    dueAt: Optional[datetime] = None
    reminder: Optional[str] = None
    flagged: Optional[bool] = None


class LeadTaskOut(BaseModel):
    id: UUID
    leadId: UUID
    title: str
    details: Optional[str] = None
    assignedToId: Optional[str] = None
    assignedToName: Optional[str] = None
    createdById: Optional[str] = None
    createdByName: Optional[str] = None
    status: str
    priority: str
    dueAt: Optional[datetime] = None
    reminder: Optional[str] = None
    completedAt: Optional[datetime] = None
    flagged: bool = False
    overdue: bool = False
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadEmailCompose(BaseModel):
    subject: str
    body: str
    toEmail: Optional[str] = None


class LeadEmailOut(BaseModel):
    id: UUID
    leadId: UUID
    subject: Optional[str] = None
    body: Optional[str] = None
    direction: str
    status: str
    toEmail: Optional[str] = None
    fromEmail: Optional[str] = None
    sentAt: Optional[datetime] = None
    openedAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadSmsSend(BaseModel):
    body: str
    toPhone: Optional[str] = None


class LeadSmsOut(BaseModel):
    id: UUID
    leadId: UUID
    body: str
    direction: str
    status: str
    toPhone: Optional[str] = None
    fromPhone: Optional[str] = None
    twilioSid: Optional[str] = None
    sentAt: Optional[datetime] = None
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadCampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    steps: List[Dict[str, Any]] = []


class LeadCampaignOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    steps: List[Dict[str, Any]] = []
    status: str
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadCampaignAssign(BaseModel):
    campaignId: str


class LeadCampaignAssignmentOut(BaseModel):
    id: UUID
    leadId: UUID
    campaignId: UUID
    campaignName: Optional[str] = None
    status: str
    progress: int
    currentStep: int
    totalSteps: int
    assignedById: Optional[str] = None
    assignedByName: Optional[str] = None
    assignedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadListingSearchCreate(BaseModel):
    name: str
    criteria: Dict[str, Any] = {}
    city: Optional[str] = None
    priceMin: Optional[float] = None
    priceMax: Optional[float] = None
    propertyTypes: List[str] = []
    intervalHours: int = 24


class LeadListingSearchOut(BaseModel):
    id: UUID
    leadId: UUID
    name: str
    criteria: Dict[str, Any] = {}
    city: Optional[str] = None
    priceMin: Optional[float] = None
    priceMax: Optional[float] = None
    propertyTypes: List[str] = []
    emailsSent: int = 0
    lastSentAt: Optional[datetime] = None
    nextSendAt: Optional[datetime] = None
    intervalHours: int = 24
    active: bool = True

    class Config:
        from_attributes = True


class LeadPropertyViewCreate(BaseModel):
    propertyType: Optional[str] = None
    beds: Optional[int] = None
    baths: Optional[int] = None
    price: Optional[float] = None
    city: Optional[str] = None
    address: Optional[str] = None
    mlsNumber: Optional[str] = None
    viewedAt: Optional[datetime] = None


class LeadPropertyViewOut(BaseModel):
    id: UUID
    leadId: UUID
    propertyType: Optional[str] = None
    beds: Optional[int] = None
    baths: Optional[int] = None
    price: Optional[float] = None
    city: Optional[str] = None
    address: Optional[str] = None
    mlsNumber: Optional[str] = None
    viewedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadSaleCreate(BaseModel):
    agentRole: Optional[str] = None
    closingDate: Optional[datetime] = None
    mlsNumber: Optional[str] = None
    sellingPrice: Optional[float] = None


class LeadSaleOut(BaseModel):
    id: UUID
    leadId: UUID
    agentRole: Optional[str] = None
    closingDate: Optional[datetime] = None
    mlsNumber: Optional[str] = None
    sellingPrice: Optional[float] = None
    createdAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeadAdditionalContactCreate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    relationshipLabel: Optional[str] = None


class LeadAdditionalContactOut(BaseModel):
    id: UUID
    leadId: UUID
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    relationshipLabel: Optional[str] = None

    class Config:
        from_attributes = True


class LeadSavedFilterCreate(BaseModel):
    name: str
    filters: Dict[str, Any] = {}
    pinned: bool = False
    pinOrder: int = 0
    color: Optional[str] = None


class LeadSavedFilterOut(BaseModel):
    id: UUID
    name: str
    filters: Dict[str, Any] = {}
    pinned: bool = False
    pinOrder: int = 0
    color: Optional[str] = None

    class Config:
        from_attributes = True


class PipelineHistoryOut(BaseModel):
    id: UUID
    pipelineStage: str
    changedAt: Optional[datetime] = None
    changedById: Optional[str] = None

    class Config:
        from_attributes = True


class IntegrationStatus(BaseModel):
    twilioConfigured: bool
    smtpConfigured: bool
