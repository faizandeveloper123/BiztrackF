from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from .common import Pagination

class ChartOfAccountsBase(BaseModel):
    account_code: str
    account_name: str
    account_type: str
    account_category: str
    description: Optional[str] = None
    parent_account_id: Optional[str] = None
    is_active: bool = True
    is_system_account: bool = False
    opening_balance: float = 0.0
    current_balance: float = 0.0
    currency: str = "USD"

class ChartOfAccountsCreate(ChartOfAccountsBase):
    pass

class ChartOfAccountsUpdate(BaseModel):
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    account_category: Optional[str] = None
    description: Optional[str] = None
    parent_account_id: Optional[str] = None
    is_active: Optional[bool] = None
    opening_balance: Optional[float] = None
    current_balance: Optional[float] = None
    currency: Optional[str] = None

class ChartOfAccountsResponse(ChartOfAccountsBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LedgerTransactionBase(BaseModel):
    transaction_date: datetime
    transaction_type: str
    amount: float
    description: str
    reference_number: Optional[str] = None
    account_id: str
    contra_account_id: Optional[str] = None
    status: str = "pending"
    meta_data: Optional[Dict[str, Any]] = None

class LedgerTransactionCreate(LedgerTransactionBase):
    pass

class LedgerTransactionUpdate(BaseModel):
    transaction_date: Optional[datetime] = None
    transaction_type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    reference_number: Optional[str] = None
    account_id: Optional[str] = None
    contra_account_id: Optional[str] = None
    status: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None

class LedgerTransactionResponse(LedgerTransactionBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class JournalEntryBase(BaseModel):
    entry_date: datetime
    reference_number: str
    description: str
    status: str = "draft"
    is_posted: bool = False
    posted_date: Optional[datetime] = None
    meta_data: Optional[Dict[str, Any]] = None

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntryUpdate(BaseModel):
    entry_date: Optional[datetime] = None
    reference_number: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    is_posted: Optional[bool] = None
    posted_date: Optional[datetime] = None
    meta_data: Optional[Dict[str, Any]] = None

class JournalEntryResponse(JournalEntryBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FinancialPeriodBase(BaseModel):
    period_name: str
    start_date: datetime
    end_date: datetime
    is_closed: bool = False
    closed_date: Optional[datetime] = None
    notes: Optional[str] = None

class FinancialPeriodCreate(FinancialPeriodBase):
    pass

class FinancialPeriodUpdate(BaseModel):
    period_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_closed: Optional[bool] = None
    closed_date: Optional[datetime] = None
    notes: Optional[str] = None

class FinancialPeriodResponse(FinancialPeriodBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BudgetBase(BaseModel):
    budget_name: str
    description: Optional[str] = None
    start_date: datetime
    end_date: datetime
    total_amount: float
    currency: str = "USD"
    is_active: bool = True
    meta_data: Optional[Dict[str, Any]] = None

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    budget_name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
    meta_data: Optional[Dict[str, Any]] = None

class BudgetResponse(BudgetBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BudgetItemBase(BaseModel):
    account_id: str
    budgeted_amount: float
    actual_amount: float = 0.0
    variance: float = 0.0
    notes: Optional[str] = None

class BudgetItemCreate(BudgetItemBase):
    pass

class BudgetItemUpdate(BaseModel):
    account_id: Optional[str] = None
    budgeted_amount: Optional[float] = None
    actual_amount: Optional[float] = None
    variance: Optional[float] = None
    notes: Optional[str] = None

class BudgetItemResponse(BudgetItemBase):
    id: str
    budget_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TrialBalanceAccount(BaseModel):
    account_id: str
    account_code: str
    account_name: str
    account_type: str
    account_category: str
    debit_balance: float
    credit_balance: float

class TrialBalanceResponse(BaseModel):
    as_of_date: datetime
    accounts: List[TrialBalanceAccount]

class IncomeStatementPeriod(BaseModel):
    start_date: datetime
    end_date: datetime

class IncomeStatementResponse(BaseModel):
    period: IncomeStatementPeriod
    revenue: float
    expenses: float
    net_income: float

class BalanceSheetAccount(BaseModel):
    account_id: str
    account_name: str
    balance: float

class BalanceSheetSection(BaseModel):
    total: float
    accounts: List[BalanceSheetAccount]

class BalanceSheetResponse(BaseModel):
    as_of_date: datetime
    assets: BalanceSheetSection
    liabilities: BalanceSheetSection
    equity: BalanceSheetSection
    total_liabilities_and_equity: float

class ChartOfAccountsListResponse(BaseModel):
    accounts: List[ChartOfAccountsResponse]
    total: int

class LedgerTransactionsListResponse(BaseModel):
    transactions: List[LedgerTransactionResponse]
    total: int

class JournalEntriesListResponse(BaseModel):
    entries: List[JournalEntryResponse]
    total: int

class FinancialPeriodsListResponse(BaseModel):
    periods: List[FinancialPeriodResponse]
    total: int

class BudgetsListResponse(BaseModel):
    budgets: List[BudgetResponse]
    total: int

class BudgetItemsListResponse(BaseModel):
    items: List[BudgetItemResponse]
    total: int

class InvestmentType(str, Enum):
    CASH_INVESTMENT = "cash_investment"
    CARD_TRANSFER = "card_transfer"
    BANK_TRANSFER = "bank_transfer"
    EQUIPMENT_PURCHASE = "equipment_purchase"

class InvestmentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class InvestmentBase(BaseModel):
    investment_date: datetime
    investment_type: InvestmentType
    amount: float
    currency: str = "USD"
    description: str
    notes: Optional[str] = None
    reference_number: Optional[str] = None
    reference_type: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = {}
    tags: Optional[List[str]] = []

class InvestmentCreate(InvestmentBase):
    pass

class InvestmentUpdate(BaseModel):
    investment_date: Optional[datetime] = None
    investment_type: Optional[InvestmentType] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    reference_number: Optional[str] = None
    reference_type: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    status: Optional[InvestmentStatus] = None

class InvestmentResponse(InvestmentBase):
    id: str
    tenant_id: str
    investment_number: str
    status: InvestmentStatus
    attachments: Optional[List[str]] = []
    created_by_id: str
    approved_by_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EquipmentInvestmentBase(BaseModel):
    equipment_name: str
    equipment_type: str
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_price: float
    estimated_life_years: int = 5
    depreciation_method: str = "straight_line"
    purchase_date: datetime
    warranty_expiry: Optional[datetime] = None
    location: Optional[str] = None
    condition: str = "new"
    notes: Optional[str] = None

class EquipmentInvestmentCreate(EquipmentInvestmentBase):
    pass

class EquipmentInvestmentUpdate(BaseModel):
    equipment_name: Optional[str] = None
    equipment_type: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    purchase_price: Optional[float] = None
    estimated_life_years: Optional[int] = None
    depreciation_method: Optional[str] = None
    purchase_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    location: Optional[str] = None
    condition: Optional[str] = None
    notes: Optional[str] = None

class EquipmentInvestmentResponse(EquipmentInvestmentBase):
    id: str
    tenant_id: str
    investment_id: str
    attachments: Optional[List[str]] = []
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InvestmentTransactionBase(BaseModel):
    transaction_date: datetime
    transaction_type: str
    amount: float
    currency: str = "USD"
    debit_account_id: str
    credit_account_id: str
    description: str
    reference_number: Optional[str] = None

class InvestmentTransactionCreate(InvestmentTransactionBase):
    pass

class InvestmentTransactionUpdate(BaseModel):
    transaction_date: Optional[datetime] = None
    transaction_type: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    debit_account_id: Optional[str] = None
    credit_account_id: Optional[str] = None
    description: Optional[str] = None
    reference_number: Optional[str] = None
    status: Optional[str] = None

class InvestmentTransactionResponse(InvestmentTransactionBase):
    id: str
    tenant_id: str
    investment_id: str
    status: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class InvestmentDashboardStats(BaseModel):
    total_investments: int
    total_amount: float
    cash_investments: int
    equipment_investments: int
    pending_investments: int
    completed_investments: int
    monthly_investments: float
    quarterly_investments: float
    yearly_investments: float

class InvestmentsListResponse(BaseModel):
    investments: List[InvestmentResponse]
    total: int

class EquipmentInvestmentsListResponse(BaseModel):
    equipment_investments: List[EquipmentInvestmentResponse]
    total: int

class AccountReceivableStatus(str, Enum):
    PENDING = "pending"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"
    WRITTEN_OFF = "written_off"

class AccountReceivableBase(BaseModel):
    invoice_id: str
    invoice_number: str
    customer_id: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    due_date: datetime
    invoice_date: datetime
    invoice_amount: float
    amount_paid: float
    outstanding_balance: float
    currency: str = "USD"
    status: AccountReceivableStatus = AccountReceivableStatus.PENDING
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    days_overdue: int = 0

class AccountReceivableCreate(AccountReceivableBase):
    pass

class AccountReceivableUpdate(BaseModel):
    invoice_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    due_date: Optional[datetime] = None
    amount_paid: Optional[float] = None
    outstanding_balance: Optional[float] = None
    status: Optional[AccountReceivableStatus] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    days_overdue: Optional[int] = None

class AccountReceivable(AccountReceivableBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AccountReceivableResponse(AccountReceivableBase):
    id: str
    tenant_id: str
    created_by_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AccountReceivablesListResponse(BaseModel):
    account_receivables: List[AccountReceivableResponse]
    total: int
    total_outstanding: float
    total_overdue: float

