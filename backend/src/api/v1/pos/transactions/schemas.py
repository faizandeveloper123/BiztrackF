from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from .....models.common import Pagination
from .....models.pos.enums import POSPaymentMethod, POSTransactionStatus


class POSTransactionItem(BaseModel):
    productId: str
    productName: str
    sku: str
    quantity: int
    unitPrice: float
    discount: float = 0.0
    taxRate: float = 0.0
    total: float


class POSTransactionBase(BaseModel):
    transactionNumber: str
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    items: List[POSTransactionItem]
    subtotal: float
    discount: float = 0.0
    taxAmount: float = 0.0
    total: float
    paymentMethod: POSPaymentMethod
    cashAmount: float = 0.0
    changeAmount: float = 0.0
    notes: Optional[str] = None
    status: POSTransactionStatus = POSTransactionStatus.PENDING


class POSTransactionCreate(BaseModel):
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    items: List[POSTransactionItem]
    discount: float = 0.0
    taxRate: float = 0.0
    paymentMethod: POSPaymentMethod
    cashAmount: float = 0.0
    notes: Optional[str] = None


class POSTransactionUpdate(BaseModel):
    status: Optional[POSTransactionStatus] = None
    notes: Optional[str] = None


class POSTransaction(POSTransactionBase):
    id: str
    tenant_id: str
    shiftId: str
    cashierId: str
    cashierName: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class POSTransactionsResponse(BaseModel):
    transactions: List[POSTransaction]
    pagination: Pagination


class POSTransactionResponse(BaseModel):
    transaction: POSTransaction


class POSTransactionFilters(BaseModel):
    status: Optional[str] = None
    paymentMethod: Optional[str] = None
    shiftId: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
    search: Optional[str] = None
