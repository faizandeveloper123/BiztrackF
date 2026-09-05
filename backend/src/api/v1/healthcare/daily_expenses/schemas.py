from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class DailyExpenseBase(BaseModel):
    category_id: str
    expense_date: date
    amount: float
    description: Optional[str] = None


class DailyExpenseCreate(DailyExpenseBase):
    pass


class DailyExpenseUpdate(BaseModel):
    category_id: Optional[str] = None
    expense_date: Optional[date] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class DailyExpense(DailyExpenseBase):
    id: str
    tenant_id: str
    category_name: Optional[str] = None
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class DailyExpensesResponse(BaseModel):
    expenses: List[DailyExpense]
    total: int
