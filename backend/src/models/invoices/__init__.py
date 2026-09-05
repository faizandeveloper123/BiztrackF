from __future__ import annotations

from .invoice import Invoice
from .payment import Payment
from .share_link import InvoiceShareLink
from .delivery_note import DeliveryNote

__all__ = [
    "Invoice",
    "Payment",
    "InvoiceShareLink",
    "DeliveryNote",
    "InvoiceStatus",
    "PaymentMethod",
    "PaymentStatus",
    "InvoiceItem",
    "InvoiceItemCreate",
    "InvoiceItemUpdate",
    "InvoiceBase",
    "InvoiceCreate",
    "InvoiceUpdate",
    "InvoiceResponse",
    "InvoicesResponse",
    "InvoiceFilters",
    "PaymentBase",
    "PaymentCreate",
    "PaymentUpdate",
    "PaymentResponse",
    "PaymentsResponse",
    "PaymentFilters",
    "InvoiceMetrics",
    "InvoiceDashboard",
]


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
        "PaymentResponse",
        "PaymentsResponse",
        "PaymentFilters",
    }
    _dashboard = {
        "InvoiceMetrics",
        "InvoiceDashboard",
    }
    if name in _items:
        m = importlib.import_module("...api.v1.invoices.items.schemas", __package__)
        return getattr(m, name)
    if name in _payments:
        m = importlib.import_module("...api.v1.invoices.payments.schemas", __package__)
        return getattr(m, name)
    if name in _dashboard:
        m = importlib.import_module("...api.v1.invoices.dashboard.schemas", __package__)
        return getattr(m, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
