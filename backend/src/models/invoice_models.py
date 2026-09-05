from __future__ import annotations

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class InvoiceCustomizationBase(BaseModel):
    company_name: str
    company_logo_url: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_website: Optional[str] = None
    bank_sort_code: Optional[str] = None
    bank_account_number: Optional[str] = None
    payment_instructions: Optional[str] = None
    primary_color: str = "#1e40af"
    secondary_color: str = "#6b7280"
    accent_color: str = "#f3f4f6"
    show_vehicle_info: bool = True
    show_parts_section: bool = True
    show_labour_section: bool = True
    show_comments_section: bool = True
    footer_text: Optional[str] = None
    show_contact_info_in_footer: bool = True
    footer_background_color: str = "#1e3a8a"
    grid_color: str = "#cccccc"
    thank_you_message: str = "Thank you for your business!"
    enquiry_message: str = "Should you have any enquiries concerning this invoice,"
    contact_message: str = "please contact us at your convenience."
    default_payment_instructions: str = "Make all payments to your company name"
    default_currency: str = "USD"
    custom_fields: Optional[Dict[str, Any]] = {}


class InvoiceCustomizationCreate(InvoiceCustomizationBase):
    pass


class InvoiceCustomizationUpdate(BaseModel):
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    company_address: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_website: Optional[str] = None
    bank_sort_code: Optional[str] = None
    bank_account_number: Optional[str] = None
    payment_instructions: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    accent_color: Optional[str] = None
    show_vehicle_info: Optional[bool] = None
    show_parts_section: Optional[bool] = None
    show_labour_section: Optional[bool] = None
    show_comments_section: Optional[bool] = None
    footer_text: Optional[str] = None
    show_contact_info_in_footer: Optional[bool] = None
    footer_background_color: Optional[str] = None
    grid_color: Optional[str] = None
    thank_you_message: Optional[str] = None
    enquiry_message: Optional[str] = None
    contact_message: Optional[str] = None
    default_payment_instructions: Optional[str] = None
    default_currency: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class InvoiceCustomization(InvoiceCustomizationBase):
    id: str
    tenant_id: str
    created_by: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceCustomizationResponse(BaseModel):
    customization: InvoiceCustomization

    class Config:
        from_attributes = True


def __getattr__(name: str):
    import importlib

    _items = {
        "InvoiceStatus",
        "InvoiceItem",
        "InvoiceItemCreate",
        "InvoiceItemUpdate",
        "InvoiceBase",
        "InvoiceCreate",
        "InvoiceUpdate",
        "Invoice",
        "InvoiceResponse",
        "InvoicesResponse",
        "InvoiceFilters",
    }
    _payments = {
        "PaymentMethod",
        "PaymentStatus",
        "PaymentBase",
        "PaymentCreate",
        "PaymentUpdate",
        "Payment",
        "PaymentResponse",
        "PaymentsResponse",
        "PaymentFilters",
    }
    _dashboard = {
        "InvoiceMetrics",
        "InvoiceDashboard",
    }
    if name in _items:
        m = importlib.import_module("..api.v1.invoices.items.schemas", __package__)
        return getattr(m, name)
    if name in _payments:
        m = importlib.import_module("..api.v1.invoices.payments.schemas", __package__)
        return getattr(m, name)
    if name in _dashboard:
        m = importlib.import_module("..api.v1.invoices.dashboard.schemas", __package__)
        return getattr(m, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


__all__ = [
    "InvoiceCustomizationBase",
    "InvoiceCustomizationCreate",
    "InvoiceCustomizationUpdate",
    "InvoiceCustomization",
    "InvoiceCustomizationResponse",
    "InvoiceStatus",
    "InvoiceItem",
    "InvoiceItemCreate",
    "InvoiceItemUpdate",
    "InvoiceBase",
    "InvoiceCreate",
    "InvoiceUpdate",
    "Invoice",
    "InvoiceResponse",
    "InvoicesResponse",
    "InvoiceFilters",
    "PaymentMethod",
    "PaymentStatus",
    "PaymentBase",
    "PaymentCreate",
    "PaymentUpdate",
    "Payment",
    "PaymentResponse",
    "PaymentsResponse",
    "PaymentFilters",
    "InvoiceMetrics",
    "InvoiceDashboard",
]
