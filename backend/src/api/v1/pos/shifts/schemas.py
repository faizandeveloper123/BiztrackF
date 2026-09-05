from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from .....models.common import Pagination
from .....models.pos.enums import POSShiftStatus


class POSShiftBase(BaseModel):
    shiftNumber: str
    openingBalance: float
    closingBalance: Optional[float] = None
    totalSales: float = 0.0
    totalTransactions: int = 0
    status: POSShiftStatus = POSShiftStatus.OPEN
    notes: Optional[str] = None


class POSShiftCreate(BaseModel):
    openingBalance: float
    notes: Optional[str] = None


class POSShiftUpdate(BaseModel):
    closingBalance: Optional[float] = None
    status: Optional[POSShiftStatus] = None
    notes: Optional[str] = None


class POSShift(POSShiftBase):
    id: str
    tenant_id: str
    cashierId: str
    cashierName: str
    openedAt: datetime
    closedAt: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class POSShiftsResponse(BaseModel):
    shifts: List[POSShift]
    pagination: Pagination


class POSShiftResponse(BaseModel):
    shift: POSShift


class POSShiftFilters(BaseModel):
    status: Optional[str] = None
    cashierId: Optional[str] = None
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None
