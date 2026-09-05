from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from ..items.schemas import Invoice


class InvoiceMetrics(BaseModel):
    totalInvoices: int
    paidInvoices: int
    overdueInvoices: int
    draftInvoices: int
    totalRevenue: float
    purchaseOrderTotal: float
    netRevenue: float
    outstandingAmount: float
    overdueAmount: float
    averagePaymentTime: float


class PurchaseOrderSummary(BaseModel):
    id: str
    orderNumber: str
    supplierName: str
    orderDate: Optional[str] = None
    status: str
    totalAmount: float
    createdAt: Optional[datetime] = None


class InvoiceDashboard(BaseModel):
    metrics: InvoiceMetrics
    recentInvoices: List[Invoice]
    overdueInvoices: List[Invoice]
    topCustomers: List[Dict[str, Any]]
    monthlyRevenue: List[Dict[str, Any]]
    recentPurchaseOrders: List[PurchaseOrderSummary]
