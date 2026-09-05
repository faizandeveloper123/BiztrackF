from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID

from .....models.labeled_contact_items import LabeledEmailItem, LabeledPhoneItem

class GuarantorBase(BaseModel):
    name: str
    mobile: Optional[str] = None
    cnic: Optional[str] = None
    residential_address: Optional[str] = None
    official_address: Optional[str] = None
    occupation: Optional[str] = None
    relation: Optional[str] = None
    display_order: Optional[int] = 0


class GuarantorCreate(GuarantorBase):
    pass


class GuarantorUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    cnic: Optional[str] = None
    residential_address: Optional[str] = None
    official_address: Optional[str] = None
    occupation: Optional[str] = None
    relation: Optional[str] = None
    display_order: Optional[int] = None


class GuarantorResponse(GuarantorBase):
    id: UUID
    tenant_id: UUID
    customer_id: UUID
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True


