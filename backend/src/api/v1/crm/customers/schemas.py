from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID

from .....models.labeled_contact_items import LabeledEmailItem, LabeledPhoneItem

class CustomerAttachmentItem(BaseModel):
    url: str
    original_filename: Optional[str] = None
    s3_key: Optional[str] = None

class CustomerBase(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    phone: Optional[str] = Field(None, max_length=20)

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v
    mobile: Optional[str] = Field(None, max_length=20)
    cnic: Optional[str] = Field(None, max_length=15)
    dateOfBirth: Optional[datetime] = None
    gender: Optional[str] = Field(None, pattern=r"^(male|female|other)$")
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)
    postalCode: Optional[str] = Field(None, max_length=20)
    customerType: Optional[str] = Field(default="individual", pattern=r"^(individual|business)$")
    customerStatus: Optional[str] = Field(default="active", pattern=r"^(active|inactive|blocked)$")
    creditLimit: Optional[float] = Field(default=None, ge=0)
    currentBalance: Optional[float] = Field(default=None)
    paymentTerms: Optional[str] = Field(default="Cash", pattern=r"^(Credit|Card|Cash|Due Payments|immediate|net30|net60)$")
    assignedToId: Optional[UUID] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    attachments: List[CustomerAttachmentItem] = Field(default_factory=list)
    image_url: Optional[str] = None
    emails: List[LabeledEmailItem] = Field(default_factory=list)
    phones: List[LabeledPhoneItem] = Field(default_factory=list)

    @field_validator("attachments", mode="before")
    @classmethod
    def normalize_attachments(cls, v):
        if v is None:
            return []
        out = []
        for item in v:
            if isinstance(item, str):
                out.append({"url": item})
            elif isinstance(item, dict):
                out.append(item)
        return out

    @field_validator("emails", mode="before")
    @classmethod
    def normalize_emails(cls, v):
        if v is None:
            return []
        out = []
        for item in v:
            if isinstance(item, dict):
                out.append(item)
        return out

    @field_validator("phones", mode="before")
    @classmethod
    def normalize_phones(cls, v):
        if v is None:
            return []
        out = []
        for item in v:
            if isinstance(item, dict):
                out.append(item)
        return out

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    firstName: Optional[str] = Field(None, min_length=1, max_length=100)
    lastName: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)
    cnic: Optional[str] = Field(None, max_length=15)
    dateOfBirth: Optional[datetime] = None
    gender: Optional[str] = Field(None, pattern=r"^(male|female|other)$")
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postalCode: Optional[str] = Field(None, max_length=20)
    customerType: Optional[str] = Field(None, pattern=r"^(individual|business)$")
    customerStatus: Optional[str] = Field(None, pattern=r"^(active|inactive|blocked)$")
    creditLimit: Optional[float] = Field(None, ge=0)
    currentBalance: Optional[float] = None
    paymentTerms: Optional[str] = Field(None, pattern=r"^(Credit|Card|Cash|Due Payments|immediate|net30|net60)$")
    assignedToId: Optional[UUID] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[CustomerAttachmentItem]] = None
    image_url: Optional[str] = None
    emails: Optional[List[LabeledEmailItem]] = None
    phones: Optional[List[LabeledPhoneItem]] = None

class CustomerResponse(CustomerBase):
    id: UUID
    customerId: str
    tenant_id: UUID
    isActive: bool
    createdAt: datetime
    updatedAt: datetime

    @model_validator(mode='before')
    @classmethod
    def hydrate_customer_orm(cls, data: Any):
        if data is None or not hasattr(data, '_sa_instance_state'):
            return data
        from sqlalchemy.inspection import inspect as sa_inspect
        c = data
        emails = list(c.emails or [])
        if not emails and getattr(c, 'email', None):
            em = (c.email or '').strip()
            if em:
                emails = [{"value": em, "label": "personal"}]
        phones = list(c.phones or [])
        if not phones:
            if getattr(c, 'phone', None) and str(c.phone).strip():
                phones.append({"value": str(c.phone).strip(), "label": "work"})
            if getattr(c, 'mobile', None) and str(c.mobile).strip():
                phones.append({"value": str(c.mobile).strip(), "label": "personal"})
        out = {}
        for attr in sa_inspect(c).mapper.column_attrs:
            out[attr.key] = getattr(c, attr.key)
        out["emails"] = emails
        out["phones"] = phones
        return out

    class Config:
        from_attributes = True

class CustomersListResponse(BaseModel):
    customers: List[CustomerResponse]
    total: int

class CustomerStatsResponse(BaseModel):
    total_customers: int
    active_customers: int
    inactive_customers: int
    blocked_customers: int
    individual_customers: int
    business_customers: int
    recent_customers: int
