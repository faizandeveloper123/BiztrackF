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

class ContactAttachmentItem(BaseModel):
    url: str
    original_filename: Optional[str] = None
    s3_key: Optional[str] = None

class ContactAddressItem(BaseModel):
    label: Optional[str] = None
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postalCode: Optional[str] = None
    country: Optional[str] = None

class ContactSocialLinks(BaseModel):
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    x: Optional[str] = None
    linkedin: Optional[str] = None
    skype: Optional[str] = None
    tiktok: Optional[str] = None
    threads: Optional[str] = None

class LeadBase(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: Optional[LeadSource] = LeadSource.WEBSITE
    status: LeadStatus = LeadStatus.NEW
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    estimatedValue: Optional[float] = None
    expectedCloseDate: Optional[str] = None
    score: int = 0
    budget: Optional[float] = None
    timeline: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    estimatedValue: Optional[float] = None
    expectedCloseDate: Optional[str] = None
    score: Optional[int] = None
    budget: Optional[float] = None
    timeline: Optional[str] = None

class Lead(LeadBase):
    id: UUID
    tenant_id: UUID
    createdBy: Optional[str] = None
    assignedToUser: Optional[Dict[str, str]] = None
    convertedToContact: Optional[str] = None
    convertedToOpportunity: Optional[str] = None
    lastContactDate: Optional[datetime] = None
    nextFollowUpDate: Optional[datetime] = None
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    @field_validator("assignedTo", mode="before")
    @classmethod
    def coerce_assigned_to(cls, v):
        if v is None:
            return None
        if hasattr(v, "id"):
            return str(v.id)
        if isinstance(v, str) and not v.strip():
            return None
        return str(v)

    @field_validator("leadSource", mode="before")
    @classmethod
    def normalize_lead_source(cls, v):
        if v is None or v == "":
            return None
        value = v.value if hasattr(v, "value") else str(v)
        allowed = {item.value for item in LeadSource}
        if value not in allowed:
            return LeadSource.OTHER.value
        return value

    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    firstName: str
    lastName: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    emails: List[LabeledEmailItem] = Field(default_factory=list)
    phones: List[LabeledPhoneItem] = Field(default_factory=list)
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    companyId: Optional[str] = None
    contactType: ContactType = ContactType.CUSTOMER
    isPrimary: bool = False
    notes: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []
    attachments: List[ContactAttachmentItem] = Field(default_factory=list)
    isActive: bool = True
    initials: Optional[str] = None
    fullName: Optional[str] = None
    birthday: Optional[datetime] = None
    businessTaxId: Optional[str] = None
    website: Optional[str] = None
    addresses: List[ContactAddressItem] = Field(default_factory=list)
    socialLinks: ContactSocialLinks = Field(default_factory=ContactSocialLinks)
    assignedTo: Optional[str] = None
    clientValue: Optional[float] = None

    @field_validator("initials", "fullName", "businessTaxId", "website", mode="before")
    @classmethod
    def empty_optional_str(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @field_validator("birthday", mode="before")
    @classmethod
    def parse_birthday(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return None
            try:
                return datetime.fromisoformat(s.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None

    @field_validator("addresses", mode="before")
    @classmethod
    def normalize_addresses_in(cls, v):
        if v is None:
            return []
        out = []
        for item in v:
            if isinstance(item, dict):
                out.append(item)
        return out

    @field_validator("socialLinks", mode="before")
    @classmethod
    def normalize_social_in(cls, v):
        if v is None:
            return ContactSocialLinks()
        if isinstance(v, dict):
            d = {}
            for k in ("facebook", "instagram", "x", "linkedin", "skype", "tiktok", "threads"):
                x = v.get(k)
                if x is not None and str(x).strip():
                    d[k] = str(x).strip()
            return ContactSocialLinks(**d)
        return v

    @field_validator("emails", mode="before")
    @classmethod
    def normalize_contact_emails(cls, v):
        if v is None:
            return []
        out = []
        for item in v:
            if isinstance(item, dict):
                out.append(item)
        return out

    @field_validator("phones", mode="before")
    @classmethod
    def normalize_contact_phones(cls, v):
        if v is None:
            return []
        out = []
        for item in v:
            if isinstance(item, dict):
                out.append(item)
        return out

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @field_validator("companyId", mode="before")
    @classmethod
    def company_id_to_str(cls, v):
        if v is None:
            return None
        if isinstance(v, UUID):
            return str(v)
        return v

    @field_validator("assignedTo", mode="before")
    @classmethod
    def empty_assigned_to_contact(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return str(v)

    @field_validator("attachments", mode="before")
    @classmethod
    def normalize_contact_attachments(cls, v):
        if v is None:
            return []
        out = []
        for item in v:
            if isinstance(item, str):
                out.append({"url": item})
            elif isinstance(item, dict):
                out.append(item)
        return out

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    emails: Optional[List[LabeledEmailItem]] = None
    phones: Optional[List[LabeledPhoneItem]] = None
    jobTitle: Optional[str] = None
    department: Optional[str] = None
    companyId: Optional[str] = None
    contactType: Optional[ContactType] = None
    isPrimary: Optional[bool] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[ContactAttachmentItem]] = None
    isActive: Optional[bool] = None
    initials: Optional[str] = None
    fullName: Optional[str] = None
    birthday: Optional[datetime] = None
    businessTaxId: Optional[str] = None
    website: Optional[str] = None
    addresses: Optional[List[ContactAddressItem]] = None
    socialLinks: Optional[ContactSocialLinks] = None
    assignedTo: Optional[str] = None
    clientValue: Optional[float] = None

    @field_validator("initials", "fullName", "businessTaxId", "website", mode="before")
    @classmethod
    def empty_optional_str_upd(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @field_validator("birthday", mode="before")
    @classmethod
    def parse_birthday_upd(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, datetime):
            return v
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return None
            try:
                return datetime.fromisoformat(s.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None

    @field_validator("addresses", mode="before")
    @classmethod
    def normalize_addresses_upd(cls, v):
        if v is None:
            return None
        out = []
        for item in v:
            if isinstance(item, dict):
                out.append(item)
        return out

    @field_validator("socialLinks", mode="before")
    @classmethod
    def normalize_social_upd(cls, v):
        if v is None:
            return None
        if isinstance(v, dict):
            d = {}
            for k in ("facebook", "instagram", "x", "linkedin", "skype", "tiktok", "threads"):
                x = v.get(k)
                if x is not None and str(x).strip():
                    d[k] = str(x).strip()
            return ContactSocialLinks(**d)
        return v

    @field_validator("emails", mode="before")
    @classmethod
    def normalize_contact_emails_upd(cls, v):
        if v is None:
            return None
        out = []
        for item in v:
            if isinstance(item, dict):
                out.append(item)
        return out

    @field_validator("phones", mode="before")
    @classmethod
    def normalize_contact_phones_upd(cls, v):
        if v is None:
            return None
        out = []
        for item in v:
            if isinstance(item, dict):
                out.append(item)
        return out

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return v

    @field_validator("companyId", mode="before")
    @classmethod
    def company_id_to_str(cls, v):
        if v is None:
            return None
        if isinstance(v, UUID):
            return str(v)
        return v

    @field_validator("assignedTo", mode="before")
    @classmethod
    def empty_assigned_to_upd(cls, v):
        if v is None:
            return None
        if isinstance(v, str) and not v.strip():
            return None
        return str(v)

class Contact(ContactBase):
    id: UUID
    tenant_id: UUID
    createdBy: Optional[str] = None
    lastContactDate: Optional[datetime] = None
    nextFollowUpDate: Optional[datetime] = None
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime
    dealClosedValue: Optional[float] = None
    remainingPayable: Optional[float] = None
    lifetimeValue: Optional[float] = None

    @model_validator(mode="before")
    @classmethod
    def hydrate_contact_orm(cls, data: Any):
        if data is None or not hasattr(data, "_sa_instance_state"):
            return data
        from sqlalchemy.inspection import inspect as sa_inspect
        c = data
        emails = list(c.emails or [])
        if not emails and getattr(c, "email", None):
            em = (c.email or "").strip()
            if em:
                emails = [{"value": em, "label": "personal"}]
        phones = list(c.phones or [])
        if not phones:
            if getattr(c, "phone", None) and str(c.phone).strip():
                phones.append({"value": str(c.phone).strip(), "label": "work"})
            if getattr(c, "mobile", None) and str(c.mobile).strip():
                phones.append({"value": str(c.mobile).strip(), "label": "personal"})
        out = {}
        for attr in sa_inspect(c).mapper.column_attrs:
            out[attr.key] = getattr(c, attr.key)
        out["emails"] = emails
        out["phones"] = phones
        aid = out.pop("assignedToId", None)
        out["assignedTo"] = str(aid) if aid is not None else None
        cs = out.get("contactSource")
        if cs:
            try:
                out["contactType"] = ContactType(str(cs))
            except ValueError:
                out["contactType"] = ContactType.OTHER
        else:
            out["contactType"] = ContactType.CUSTOMER
        return out

    class Config:
        from_attributes = True


class ContactsResponse(BaseModel):
    contacts: List[Contact]
    pagination: Pagination


class CRMContactsResponse(BaseModel):
    contacts: List[Contact]
    pagination: Pagination


class ContactLedgerEntry(BaseModel):
    id: str
    entryType: str
    revenueType: str
    amount: float
    description: Optional[str] = None
    entryDate: str
    invoiceId: Optional[str] = None
    paymentId: Optional[str] = None


class ContactLedgerResponse(BaseModel):
    entries: List[ContactLedgerEntry]
    totalPaid: float
    totalPending: float
