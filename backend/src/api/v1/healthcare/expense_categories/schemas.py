from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ExpenseCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class ExpenseCategoryCreate(ExpenseCategoryBase):
    pass


class ExpenseCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ExpenseCategory(ExpenseCategoryBase):
    id: str
    tenant_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExpenseCategoriesResponse(BaseModel):
    categories: List[ExpenseCategory]
    total: int
