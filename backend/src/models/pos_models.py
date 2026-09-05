from __future__ import annotations


def __getattr__(name: str):
    import importlib

    _map = {
        **{k: "transactions" for k in (
            "POSTransactionItem", "POSTransactionBase", "POSTransactionCreate",
            "POSTransactionUpdate", "POSTransaction", "POSTransactionsResponse",
            "POSTransactionResponse", "POSTransactionFilters",
        )},
        **{k: "shifts" for k in (
            "POSShiftBase", "POSShiftCreate", "POSShiftUpdate", "POSShift",
            "POSShiftsResponse", "POSShiftResponse", "POSShiftFilters",
        )},
        **{k: "products" for k in ("ProductFilters",)},
        **{k: "dashboard" for k in ("POSMetrics", "POSDashboard",)},
    }
    mod = _map.get(name)
    if mod is None:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    m = importlib.import_module(f"..api.v1.pos.{mod}.schemas", __package__)
    return getattr(m, name)


__all__ = [
    "POSTransactionItem", "POSTransactionBase", "POSTransactionCreate",
    "POSTransactionUpdate", "POSTransaction", "POSTransactionsResponse",
    "POSTransactionResponse", "POSTransactionFilters",
    "POSShiftBase", "POSShiftCreate", "POSShiftUpdate", "POSShift",
    "POSShiftsResponse", "POSShiftResponse", "POSShiftFilters",
    "ProductFilters", "POSMetrics", "POSDashboard",
]
