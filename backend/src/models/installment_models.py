from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class InstallmentPlanCreate(BaseModel):
    invoice_id: str
    total_amount: float
    number_of_installments: int
    frequency: str
    first_due_date: datetime
    currency: str = "USD"


class InstallmentPlanUpdate(BaseModel):
    status: Optional[str] = None


class InstallmentResponse(BaseModel):
    id: str
    tenant_id: str
    installment_plan_id: str
    sequence_number: int
    due_date: datetime
    amount: float
    status: str
    paid_amount: float
    payment_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InstallmentPlanResponse(BaseModel):
    id: str
    tenant_id: str
    invoice_id: str
    total_amount: float
    currency: str
    number_of_installments: int
    frequency: str
    first_due_date: datetime
    status: str
    created_at: datetime
    updated_at: datetime
    installments: List[InstallmentResponse] = []

    class Config:
        from_attributes = True


class ApplyPaymentRequest(BaseModel):
    amount: float
    payment_id: Optional[str] = None
