from typing import Optional

from pydantic import BaseModel, Field


class WhatsAppTemplateResponse(BaseModel):
    id: str
    template_type: str
    name: str
    body: str
    is_active: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class WhatsAppTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    body: Optional[str] = None
    is_active: Optional[bool] = None


class WhatsAppTemplatePreviewRequest(BaseModel):
    template_type: str
    booking_id: Optional[str] = None
    body: Optional[str] = None


class WhatsAppTemplatePreviewResponse(BaseModel):
    template_type: str
    template_name: str
    body: str
    rendered: str