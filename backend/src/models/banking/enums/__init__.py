from __future__ import annotations

from enum import Enum
from typing import Any, Final, List, Tuple, Type


class TransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    PAYMENT = "payment"
    REFUND = "refund"
    FEE = "fee"
    INTEREST = "interest"
    ADJUSTMENT = "adjustment"


class TransactionStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REVERSED = "reversed"


class PaymentMethod(str, Enum):
    ONLINE_TRANSFER = "online_transfer"
    DIRECT_DEBIT = "direct_debit"
    WIRE_TRANSFER = "wire_transfer"
    ACH = "ach"
    CHECK = "check"
    CASH = "cash"
    CARD_PAYMENT = "card_payment"
    MOBILE_PAYMENT = "mobile_payment"
    CRYPTOCURRENCY = "cryptocurrency"


class TillTransactionType(str, Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    ADJUSTMENT = "adjustment"


ALLOWED_BANK_ACCOUNT_TYPE_SLUGS: Final[Tuple[str, ...]] = (
    "checking",
    "savings",
    "business",
    "credit_line",
    "money_market",
)
DEFAULT_BANK_ACCOUNT_TYPE: Final[str] = "checking"


class BankAccountType(str, Enum):
    CHECKING = "checking"
    SAVINGS = "savings"
    BUSINESS = "business"
    CREDIT_LINE = "credit_line"
    MONEY_MARKET = "money_market"


def bank_account_type_slug(v: Any) -> str:
    if v is None or (isinstance(v, str) and not v.strip()):
        return DEFAULT_BANK_ACCOUNT_TYPE
    if isinstance(v, str):
        t = v.strip()
    else:
        r = getattr(v, "value", v) if v is not None else None
        t = str(r).strip() if r is not None else ""
    if not t:
        return DEFAULT_BANK_ACCOUNT_TYPE
    nk = t.upper().replace("-", "_")
    if nk in BankAccountType.__members__:
        return BankAccountType[nk].value
    sl = t.lower().replace("-", "_")
    if sl in ALLOWED_BANK_ACCOUNT_TYPE_SLUGS:
        return sl
    for m in BankAccountType:
        if t.lower() == m.value or t.upper() == m.name:
            return m.value
    return DEFAULT_BANK_ACCOUNT_TYPE


def pg_enum_values(enum_cls: Type[Enum]) -> List[str]:
    return [m.value for m in enum_cls]


__all__ = [
    "TransactionType",
    "TransactionStatus",
    "PaymentMethod",
    "TillTransactionType",
    "BankAccountType",
    "ALLOWED_BANK_ACCOUNT_TYPE_SLUGS",
    "DEFAULT_BANK_ACCOUNT_TYPE",
    "bank_account_type_slug",
    "pg_enum_values",
]
