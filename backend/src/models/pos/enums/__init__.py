from enum import Enum


class POSPaymentMethod(str, Enum):
    CASH = "cash"
    CARD = "card"
    MOBILE = "mobile"
    BANK_TRANSFER = "bank_transfer"


class POSTransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    VOID = "void"


class POSShiftStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
