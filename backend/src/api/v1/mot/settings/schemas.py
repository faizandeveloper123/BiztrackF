from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class MotSettingsResponse(BaseModel):
    inspection_price: Decimal = Field(..., ge=0)
    public_booking_enabled: bool = False
    tenant_domain: str
    tenant_name: str
    tenant_logo_url: Optional[str] = None


class MotSettingsUpdate(BaseModel):
    inspection_price: Optional[Decimal] = Field(None, ge=0)
    public_booking_enabled: Optional[bool] = None
