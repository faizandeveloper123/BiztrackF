from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
from .....models.common import Pagination


class PaymentMethod(str, Enum):
    CREDIT_CARD = "credit_card"
    BANK_TRANSFER = "bank_transfer"
    CASH = "cash"
    CHECK = "check"
    PAYPAL = "paypal"
    STRIPE = "stripe"
    OTHER = "other"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class PaymentBase(BaseModel):
    invoiceId: str
    amount: float
    paymentMethod: PaymentMethod
    paymentDate: str
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: PaymentStatus = PaymentStatus.PENDING


class PaymentCreate(BaseModel):
    invoiceId: str
    amount: float
    paymentMethod: PaymentMethod
    paymentDate: str
    reference: Optional[str] = None
    notes: Optional[str] = None


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    paymentMethod: Optional[PaymentMethod] = None
    paymentDate: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[PaymentStatus] = None


class Payment(PaymentBase):
    id: str
    tenant_id: str
    createdBy: Optional[str] = None
    processedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

    @field_validator("paymentDate", mode="before")
    @classmethod
    def payment_date_to_str(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class PaymentsResponse(BaseModel):
    payments: List[Payment]
    pagination: Pagination


class PaymentResponse(BaseModel):
    payment: Payment


class PaymentFilters(BaseModel):
    invoiceId: Optional[str] = None
    paymentMethod: Optional[str] = None
    status: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    search: Optional[str] = None
