from __future__ import annotations

from .shift import POSShift
from .transaction import POSTransaction
from .category import PosProductCategory
from .enums import POSPaymentMethod, POSTransactionStatus, POSShiftStatus

__all__ = [
    "POSShift",
    "POSTransaction",
    "PosProductCategory",
    "POSPaymentMethod",
    "POSTransactionStatus",
    "POSShiftStatus",
    "POSTransactionItem",
    "POSTransactionCreate",
    "POSTransactionUpdate",
    "POSTransactionResponse",
    "POSTransactionsResponse",
    "POSShiftCreate",
    "POSShiftUpdate",
    "POSShiftResponse",
    "POSShiftsResponse",
    "POSMetrics",
    "POSDashboard",
    "ProductFilters",
    "POSTransactionFilters",
    "POSShiftFilters",
]


def __getattr__(name: str):
    import importlib

    _transactions = {
        "POSTransactionItem",
        "POSTransactionCreate",
        "POSTransactionUpdate",
        "POSTransactionResponse",
        "POSTransactionsResponse",
        "POSTransactionFilters",
    }
    _shifts = {
        "POSShiftCreate",
        "POSShiftUpdate",
        "POSShiftResponse",
        "POSShiftsResponse",
        "POSShiftFilters",
    }
    _products = {"ProductFilters"}
    _dashboard = {"POSMetrics", "POSDashboard"}

    if name in _transactions:
        m = importlib.import_module("...api.v1.pos.transactions.schemas", __package__)
        return getattr(m, name)
    if name in _shifts:
        m = importlib.import_module("...api.v1.pos.shifts.schemas", __package__)
        return getattr(m, name)
    if name in _products:
        m = importlib.import_module("...api.v1.pos.products.schemas", __package__)
        return getattr(m, name)
    if name in _dashboard:
        m = importlib.import_module("...api.v1.pos.dashboard.schemas", __package__)
        return getattr(m, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
