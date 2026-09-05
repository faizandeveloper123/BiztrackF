import uuid
from sqlalchemy import Column, String, DateTime, Float, Text, Boolean, ForeignKey, Integer, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base
import enum

class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"
    REFUND = "refund"

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class AccountType(str, enum.Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"

class AccountCategory(str, enum.Enum):
    # Asset accounts
    CASH = "cash"
    BANK_ACCOUNT = "bank_account"
    ACCOUNTS_RECEIVABLE = "accounts_receivable"
    INVENTORY = "inventory"
    EQUIPMENT = "equipment"
    BUILDINGS = "buildings"
    VEHICLES = "vehicles"
    PREPAID_EXPENSES = "prepaid_expenses"
    
    # Liability accounts
    ACCOUNTS_PAYABLE = "accounts_payable"
    LOANS_PAYABLE = "loans_payable"
    CREDIT_CARDS = "credit_cards"
    TAXES_PAYABLE = "taxes_payable"
    WAGES_PAYABLE = "wages_payable"
    
    # Equity accounts
    OWNER_EQUITY = "owner_equity"
    RETAINED_EARNINGS = "retained_earnings"
    COMMON_STOCK = "common_stock"
    
    # Revenue accounts
    SALES_REVENUE = "sales_revenue"
    SERVICE_REVENUE = "service_revenue"
    INTEREST_INCOME = "interest_income"
    OTHER_INCOME = "other_income"
    
    # Expense accounts
    COST_OF_GOODS_SOLD = "cost_of_goods_sold"
    SALARIES_WAGES = "salaries_wages"
    RENT_EXPENSE = "rent_expense"
    UTILITIES = "utilities"
    INSURANCE = "insurance"
    MAINTENANCE = "maintenance"
    MARKETING = "marketing"
    OFFICE_SUPPLIES = "office_supplies"
    TRAVEL = "travel"
    PROFESSIONAL_FEES = "professional_fees"
    DEPRECIATION = "depreciation"
    AMORTIZATION = "amortization"
    INTEREST_EXPENSE = "interest_expense"
    OTHER_EXPENSES = "other_expenses"

class ChartOfAccounts(Base):
    __tablename__ = "chart_of_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    account_code = Column(String, nullable=False, index=True)  # e.g., 1000, 2000, 3000
    account_name = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    account_category = Column(Enum(AccountCategory), nullable=False)
    description = Column(Text, nullable=True)
    parent_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_system_account = Column(Boolean, default=False)  # For system-generated accounts
    opening_balance = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    currency = Column(String, default="USD")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="chart_of_accounts")
    parent_account = relationship("ChartOfAccounts", remote_side=[id], backref="sub_accounts")
    created_by_user = relationship("User", foreign_keys=[created_by])
    # Note: Removed problematic bidirectional relationships to fix SQLAlchemy initialization
    # debit_transactions = relationship("LedgerTransaction", foreign_keys="[LedgerTransaction.debit_account_id]", back_populates="debit_account")
    # credit_transactions = relationship("LedgerTransaction", foreign_keys="[LedgerTransaction.credit_account_id]", back_populates="credit_account")

class JournalEntry(Base):
    __tablename__ = "journal_entries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    entry_number = Column(String, unique=True, index=True)  # Auto-generated
    entry_date = Column(DateTime, nullable=False, index=True)
    reference_number = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Status and approval
    status = Column(String, default="draft")  # draft, posted, cancelled
    is_posted = Column(Boolean, default=False)
    posted_at = Column(DateTime, nullable=True)
    posted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Metadata
    tags = Column(JSON, default=[])
    attachments = Column(JSON, default=[])
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="journal_entries")
    posted_by_user = relationship("User", foreign_keys=[posted_by])
    created_by_user = relationship("User", foreign_keys=[created_by])
    transactions = relationship("LedgerTransaction", back_populates="journal_entry")

class LedgerTransaction(Base):
    __tablename__ = "ledger_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    transaction_number = Column(String, unique=True, index=True)  # Auto-generated
    transaction_date = Column(DateTime, nullable=False, index=True)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    
    # Account information
    debit_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    credit_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    
    # Reference information
    reference_type = Column(String, nullable=True)  # invoice, payment, expense, etc.
    reference_id = Column(String, nullable=True)  # ID of the referenced document
    reference_number = Column(String, nullable=True)  # Number of the referenced document
    
    # Description and notes
    description = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    
    # Metadata
    tags = Column(JSON, default=[])
    attachments = Column(JSON, default=[])
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Journal entry relationship
    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id"), nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="ledger_transactions")
    debit_account = relationship("ChartOfAccounts", foreign_keys=[debit_account_id])
    credit_account = relationship("ChartOfAccounts", foreign_keys=[credit_account_id])
    created_by_user = relationship("User", foreign_keys=[created_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    journal_entry = relationship("JournalEntry", back_populates="transactions")

class FinancialPeriod(Base):
    __tablename__ = "financial_periods"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    period_name = Column(String, nullable=False)  # e.g., "Q1 2024", "January 2024"
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    is_closed = Column(Boolean, default=False)
    closed_at = Column(DateTime, nullable=True)
    closed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Period totals
    total_revenue = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)
    net_income = Column(Float, default=0.0)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="financial_periods")
    closed_by_user = relationship("User", foreign_keys=[closed_by])
    created_by_user = relationship("User", foreign_keys=[created_by])

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    budget_name = Column(String, nullable=False)
    budget_type = Column(String, nullable=False)  # monthly, quarterly, yearly
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Budget amounts
    total_budget = Column(Float, nullable=False)
    allocated_amount = Column(Float, default=0.0)
    spent_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, default=0.0)
    
    # Status
    status = Column(String, default="active")  # active, completed, cancelled
    is_active = Column(Boolean, default=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="budgets")
    created_by_user = relationship("User", foreign_keys=[created_by])
    budget_items = relationship("BudgetItem", back_populates="budget")

class BudgetItem(Base):
    __tablename__ = "budget_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    budget_id = Column(UUID(as_uuid=True), ForeignKey("budgets.id"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    
    # Budget amounts
    budgeted_amount = Column(Float, nullable=False)
    allocated_amount = Column(Float, default=0.0)
    spent_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, default=0.0)
    
    # Metadata
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    budget = relationship("Budget", back_populates="budget_items")
    account = relationship("ChartOfAccounts")

class AccountReceivableStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"
    WRITTEN_OFF = "written_off"

class AccountReceivable(Base):
    __tablename__ = "account_receivables"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    
    # Invoice reference
    invoice_id = Column(String, nullable=False, index=True)
    invoice_number = Column(String, nullable=False)
    
    # Customer information
    customer_id = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)
    
    # Dates
    invoice_date = Column(DateTime, nullable=False)
    due_date = Column(DateTime, nullable=False)
    
    # Amounts
    invoice_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    outstanding_balance = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    
    # Status
    status = Column(Enum(AccountReceivableStatus), default=AccountReceivableStatus.PENDING)
    days_overdue = Column(Integer, default=0)
    
    # Metadata
    payment_terms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="account_receivables")
    created_by_user = relationship("User", foreign_keys=[created_by])