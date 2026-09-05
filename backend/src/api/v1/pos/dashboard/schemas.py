from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from .....models.inventory_models import Product
from ..shifts.schemas import POSShift
from ..transactions.schemas import POSTransaction


class POSMetrics(BaseModel):
    totalSales: float
    totalTransactions: int
    averageTransactionValue: float
    topProducts: List[Dict[str, Any]]
    dailySales: List[Dict[str, Any]]
    openShift: Optional[POSShift] = None


class POSDashboard(BaseModel):
    metrics: POSMetrics
    recentTransactions: List[POSTransaction]
    lowStockProducts: List[Product]
