from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc
from .ledger_models import (
    ChartOfAccounts, LedgerTransaction, JournalEntry, 
    FinancialPeriod, Budget, BudgetItem,
    TransactionType, TransactionStatus, AccountType, AccountCategory
)
import uuid

# Chart of Accounts functions
def create_chart_of_accounts(account_data: dict, db: Session) -> ChartOfAccounts:
    """Create a new chart of accounts entry"""
    db_account = ChartOfAccounts(**account_data)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def get_chart_of_accounts_by_id(account_id: str, db: Session, tenant_id: str = None) -> Optional[ChartOfAccounts]:
    """Get chart of accounts by ID"""
    query = db.query(ChartOfAccounts).filter(ChartOfAccounts.id == account_id)
    if tenant_id:
        query = query.filter(ChartOfAccounts.tenant_id == tenant_id)
    return query.first()

def get_chart_of_accounts_by_code(account_code: str, db: Session, tenant_id: str = None) -> Optional[ChartOfAccounts]:
    """Get chart of accounts by account code"""
    query = db.query(ChartOfAccounts).filter(ChartOfAccounts.account_code == account_code)
    if tenant_id:
        query = query.filter(ChartOfAccounts.tenant_id == tenant_id)
    return query.first()

def get_all_chart_of_accounts(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 1000) -> List[ChartOfAccounts]:
    """Get all chart of accounts for a tenant"""
    query = db.query(ChartOfAccounts)
    if tenant_id:
        query = query.filter(ChartOfAccounts.tenant_id == tenant_id)
    return query.order_by(ChartOfAccounts.account_code.asc()).offset(skip).limit(limit).all()

def get_chart_of_accounts_by_type(account_type: AccountType, db: Session, tenant_id: str = None) -> List[ChartOfAccounts]:
    """Get chart of accounts by account type"""
    query = db.query(ChartOfAccounts).filter(ChartOfAccounts.account_type == account_type)
    if tenant_id:
        query = query.filter(ChartOfAccounts.tenant_id == tenant_id)
    return query.order_by(ChartOfAccounts.account_code.asc()).all()

def get_chart_of_accounts_by_category(account_category: AccountCategory, db: Session, tenant_id: str = None) -> List[ChartOfAccounts]:
    """Get chart of accounts by account category"""
    query = db.query(ChartOfAccounts).filter(ChartOfAccounts.account_category == account_category)
    if tenant_id:
        query = query.filter(ChartOfAccounts.tenant_id == tenant_id)
    return query.order_by(ChartOfAccounts.account_code.asc()).all()

def update_chart_of_accounts(account_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[ChartOfAccounts]:
    """Update chart of accounts"""
    account = get_chart_of_accounts_by_id(account_id, db, tenant_id)
    if account:
        for key, value in update_data.items():
            if hasattr(account, key) and value is not None:
                setattr(account, key, value)
        account.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(account)
    return account

def delete_chart_of_accounts(account_id: str, db: Session, tenant_id: str = None) -> bool:
    """Delete chart of accounts"""
    account = get_chart_of_accounts_by_id(account_id, db, tenant_id)
    if account:
        db.delete(account)
        db.commit()
        return True
    return False

# Ledger Transaction functions
def create_ledger_transaction(transaction_data: dict, db: Session) -> LedgerTransaction:
    """Create a new ledger transaction"""
    # Generate transaction number if not provided
    if not transaction_data.get('transaction_number'):
        transaction_data['transaction_number'] = f"TXN-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    db_transaction = LedgerTransaction(**transaction_data)
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_ledger_transaction_by_id(transaction_id: str, db: Session, tenant_id: str = None) -> Optional[LedgerTransaction]:
    """Get ledger transaction by ID"""
    query = db.query(LedgerTransaction).filter(LedgerTransaction.id == transaction_id)
    if tenant_id:
        query = query.filter(LedgerTransaction.tenant_id == tenant_id)
    return query.first()

def get_ledger_transaction_by_number(transaction_number: str, db: Session, tenant_id: str = None) -> Optional[LedgerTransaction]:
    """Get ledger transaction by transaction number"""
    query = db.query(LedgerTransaction).filter(LedgerTransaction.transaction_number == transaction_number)
    if tenant_id:
        query = query.filter(LedgerTransaction.tenant_id == tenant_id)
    return query.first()

def get_all_ledger_transactions(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[LedgerTransaction]:
    """Get all ledger transactions for a tenant"""
    query = db.query(LedgerTransaction)
    if tenant_id:
        query = query.filter(LedgerTransaction.tenant_id == tenant_id)
    return query.order_by(desc(LedgerTransaction.transaction_date)).offset(skip).limit(limit).all()

def get_ledger_transactions_by_type(transaction_type: TransactionType, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[LedgerTransaction]:
    """Get ledger transactions by type"""
    query = db.query(LedgerTransaction).filter(LedgerTransaction.transaction_type == transaction_type)
    if tenant_id:
        query = query.filter(LedgerTransaction.tenant_id == tenant_id)
    return query.order_by(desc(LedgerTransaction.transaction_date)).offset(skip).limit(limit).all()

def get_ledger_transactions_by_account(account_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[LedgerTransaction]:
    """Get ledger transactions by account (debit or credit)"""
    query = db.query(LedgerTransaction).filter(
        or_(
            LedgerTransaction.debit_account_id == account_id,
            LedgerTransaction.credit_account_id == account_id
        )
    )
    if tenant_id:
        query = query.filter(LedgerTransaction.tenant_id == tenant_id)
    return query.order_by(desc(LedgerTransaction.transaction_date)).offset(skip).limit(limit).all()

def get_ledger_transactions_by_date_range(start_date: datetime, end_date: datetime, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[LedgerTransaction]:
    """Get ledger transactions by date range"""
    query = db.query(LedgerTransaction).filter(
        and_(
            LedgerTransaction.transaction_date >= start_date,
            LedgerTransaction.transaction_date <= end_date
        )
    )
    if tenant_id:
        query = query.filter(LedgerTransaction.tenant_id == tenant_id)
    return query.order_by(desc(LedgerTransaction.transaction_date)).offset(skip).limit(limit).all()

def update_ledger_transaction(transaction_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[LedgerTransaction]:
    """Update ledger transaction"""
    transaction = get_ledger_transaction_by_id(transaction_id, db, tenant_id)
    if transaction:
        for key, value in update_data.items():
            if hasattr(transaction, key) and value is not None:
                setattr(transaction, key, value)
        transaction.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(transaction)
    return transaction

def delete_ledger_transaction(transaction_id: str, db: Session, tenant_id: str = None) -> bool:
    """Delete ledger transaction"""
    transaction = get_ledger_transaction_by_id(transaction_id, db, tenant_id)
    if transaction:
        db.delete(transaction)
        db.commit()
        return True
    return False

# Journal Entry functions
def create_journal_entry(entry_data: dict, db: Session) -> JournalEntry:
    """Create a new journal entry"""
    # Generate entry number if not provided
    if not entry_data.get('entry_number'):
        entry_data['entry_number'] = f"JE-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    db_entry = JournalEntry(**entry_data)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_journal_entry_by_id(entry_id: str, db: Session, tenant_id: str = None) -> Optional[JournalEntry]:
    """Get journal entry by ID"""
    query = db.query(JournalEntry).filter(JournalEntry.id == entry_id)
    if tenant_id:
        query = query.filter(JournalEntry.tenant_id == tenant_id)
    return query.first()

def get_journal_entry_by_number(entry_number: str, db: Session, tenant_id: str = None) -> Optional[JournalEntry]:
    """Get journal entry by entry number"""
    query = db.query(JournalEntry).filter(JournalEntry.entry_number == entry_number)
    if tenant_id:
        query = query.filter(JournalEntry.tenant_id == tenant_id)
    return query.first()

def get_all_journal_entries(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[JournalEntry]:
    """Get all journal entries for a tenant"""
    query = db.query(JournalEntry)
    if tenant_id:
        query = query.filter(JournalEntry.tenant_id == tenant_id)
    return query.order_by(desc(JournalEntry.entry_date)).offset(skip).limit(limit).all()

def get_journal_entries_by_status(status: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[JournalEntry]:
    """Get journal entries by status"""
    query = db.query(JournalEntry).filter(JournalEntry.status == status)
    if tenant_id:
        query = query.filter(JournalEntry.tenant_id == tenant_id)
    return query.order_by(desc(JournalEntry.entry_date)).offset(skip).limit(limit).all()

def update_journal_entry(entry_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[JournalEntry]:
    """Update journal entry"""
    entry = get_journal_entry_by_id(entry_id, db, tenant_id)
    if entry:
        for key, value in update_data.items():
            if hasattr(entry, key) and value is not None:
                setattr(entry, key, value)
        entry.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(entry)
    return entry

def delete_journal_entry(entry_id: str, db: Session, tenant_id: str = None) -> bool:
    """Delete journal entry"""
    entry = get_journal_entry_by_id(entry_id, db, tenant_id)
    if entry:
        db.delete(entry)
        db.commit()
        return True
    return False

def post_journal_entry(entry_id: str, db: Session, tenant_id: str = None, posted_by: str = None) -> Optional[JournalEntry]:
    """Post a journal entry"""
    entry = get_journal_entry_by_id(entry_id, db, tenant_id)
    if entry and entry.status == "draft":
        entry.status = "posted"
        entry.is_posted = True
        entry.posted_at = datetime.utcnow()
        entry.posted_by = posted_by
        entry.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(entry)
    return entry

# Financial Period functions
def create_financial_period(period_data: dict, db: Session) -> FinancialPeriod:
    """Create a new financial period"""
    db_period = FinancialPeriod(**period_data)
    db.add(db_period)
    db.commit()
    db.refresh(db_period)
    return db_period

def get_financial_period_by_id(period_id: str, db: Session, tenant_id: str = None) -> Optional[FinancialPeriod]:
    """Get financial period by ID"""
    query = db.query(FinancialPeriod).filter(FinancialPeriod.id == period_id)
    if tenant_id:
        query = query.filter(FinancialPeriod.tenant_id == tenant_id)
    return query.first()

def get_current_financial_period(db: Session, tenant_id: str = None) -> Optional[FinancialPeriod]:
    """Get current financial period"""
    current_date = datetime.utcnow()
    query = db.query(FinancialPeriod).filter(
        and_(
            FinancialPeriod.start_date <= current_date,
            FinancialPeriod.end_date >= current_date,
            FinancialPeriod.is_closed == False
        )
    )
    if tenant_id:
        query = query.filter(FinancialPeriod.tenant_id == tenant_id)
    return query.first()

def get_all_financial_periods(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[FinancialPeriod]:
    """Get all financial periods for a tenant"""
    query = db.query(FinancialPeriod)
    if tenant_id:
        query = query.filter(FinancialPeriod.tenant_id == tenant_id)
    return query.order_by(desc(FinancialPeriod.start_date)).offset(skip).limit(limit).all()

def close_financial_period(period_id: str, db: Session, tenant_id: str = None, closed_by: str = None) -> Optional[FinancialPeriod]:
    """Close a financial period"""
    period = get_financial_period_by_id(period_id, db, tenant_id)
    if period and not period.is_closed:
        period.is_closed = True
        period.closed_at = datetime.utcnow()
        period.closed_by = closed_by
        period.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(period)
    return period

# Budget functions
def create_budget(budget_data: dict, db: Session) -> Budget:
    """Create a new budget"""
    db_budget = Budget(**budget_data)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def get_budget_by_id(budget_id: str, db: Session, tenant_id: str = None) -> Optional[Budget]:
    """Get budget by ID"""
    query = db.query(Budget).filter(Budget.id == budget_id)
    if tenant_id:
        query = query.filter(Budget.tenant_id == tenant_id)
    return query.first()

def get_all_budgets(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Budget]:
    """Get all budgets for a tenant"""
    query = db.query(Budget)
    if tenant_id:
        query = query.filter(Budget.tenant_id == tenant_id)
    return query.order_by(desc(Budget.created_at)).offset(skip).limit(limit).all()

def get_active_budgets(db: Session, tenant_id: str = None) -> List[Budget]:
    """Get active budgets for a tenant"""
    query = db.query(Budget).filter(Budget.is_active == True)
    if tenant_id:
        query = query.filter(Budget.tenant_id == tenant_id)
    return query.order_by(desc(Budget.created_at)).all()

def update_budget(budget_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Budget]:
    """Update budget"""
    budget = get_budget_by_id(budget_id, db, tenant_id)
    if budget:
        for key, value in update_data.items():
            if hasattr(budget, key) and value is not None:
                setattr(budget, key, value)
        budget.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(budget)
    return budget

def delete_budget(budget_id: str, db: Session, tenant_id: str = None) -> bool:
    """Delete budget"""
    budget = get_budget_by_id(budget_id, db, tenant_id)
    if budget:
        db.delete(budget)
        db.commit()
        return True
    return False

# Budget Item functions
def create_budget_item(item_data: dict, db: Session) -> BudgetItem:
    """Create a new budget item"""
    db_item = BudgetItem(**item_data)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def get_budget_items_by_budget(budget_id: str, db: Session, tenant_id: str = None) -> List[BudgetItem]:
    """Get budget items by budget ID"""
    query = db.query(BudgetItem).filter(BudgetItem.budget_id == budget_id)
    if tenant_id:
        # Join with budget to check tenant_id
        query = query.join(Budget).filter(Budget.tenant_id == tenant_id)
    return query.all()

def update_budget_item(item_id: str, update_data: dict, db: Session) -> Optional[BudgetItem]:
    """Update budget item"""
    item = db.query(BudgetItem).filter(BudgetItem.id == item_id).first()
    if item:
        for key, value in update_data.items():
            if hasattr(item, key) and value is not None:
                setattr(item, key, value)
        item.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(item)
    return item

def delete_budget_item(item_id: str, db: Session) -> bool:
    """Delete budget item"""
    item = db.query(BudgetItem).filter(BudgetItem.id == item_id).first()
    if item:
        db.delete(item)
        db.commit()
        return True
    return False

# Financial reporting functions
def get_account_balance(account_id: str, db: Session, tenant_id: str = None, as_of_date: datetime = None) -> float:
    """Get account balance as of a specific date"""
    # Debit transactions increase asset/expense accounts, credit transactions increase liability/equity/revenue accounts
    account = get_chart_of_accounts_by_id(account_id, db, tenant_id)
    if not account:
        return 0.0
    
    # Build base query for transactions
    debit_query = db.query(func.sum(LedgerTransaction.amount)).filter(
        and_(
            LedgerTransaction.debit_account_id == account_id,
            LedgerTransaction.tenant_id == tenant_id
        )
    )
    
    credit_query = db.query(func.sum(LedgerTransaction.amount)).filter(
        and_(
            LedgerTransaction.credit_account_id == account_id,
            LedgerTransaction.tenant_id == tenant_id
        )
    )
    
    if as_of_date:
        debit_query = debit_query.filter(LedgerTransaction.transaction_date <= as_of_date)
        credit_query = credit_query.filter(LedgerTransaction.transaction_date <= as_of_date)
    
    debit_amount = debit_query.scalar() or 0.0
    credit_amount = credit_query.scalar() or 0.0
    
    if account.account_type in [AccountType.ASSET, AccountType.EXPENSE]:
        # For asset/expense accounts: debit increases, credit decreases
        return account.opening_balance + debit_amount - credit_amount
    else:
        # For liability/equity/revenue accounts: credit increases, debit decreases
        return account.opening_balance + credit_amount - debit_amount

def get_trial_balance(db: Session, tenant_id: str = None, as_of_date: datetime = None) -> List[Dict[str, Any]]:
    """Get trial balance as of a specific date"""
    accounts = get_all_chart_of_accounts(db, tenant_id)
    trial_balance = []
    
    for account in accounts:
        balance = get_account_balance(str(account.id), db, tenant_id, as_of_date)
        # Include all accounts, even with zero balances
        trial_balance.append({
            "account_id": str(account.id),
            "account_code": account.account_code,
            "account_name": account.account_name,
            "account_type": account.account_type.value,
            "account_category": account.account_category.value,
            "debit_balance": balance if balance > 0 else 0,
            "credit_balance": abs(balance) if balance < 0 else 0
        })
    
    return trial_balance

def get_income_statement(db: Session, tenant_id: str = None, start_date: datetime = None, end_date: datetime = None) -> Dict[str, Any]:
    """Get income statement for a date range"""
    if not start_date:
        start_date = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Get revenue accounts
    revenue_accounts = get_chart_of_accounts_by_type(AccountType.REVENUE, db, tenant_id)
    total_revenue = 0.0
    
    for account in revenue_accounts:
        balance = get_account_balance(str(account.id), db, tenant_id, end_date)
        total_revenue += balance
    
    # Get expense accounts
    expense_accounts = get_chart_of_accounts_by_type(AccountType.EXPENSE, db, tenant_id)
    total_expenses = 0.0
    
    for account in expense_accounts:
        balance = get_account_balance(str(account.id), db, tenant_id, end_date)
        total_expenses += balance
    
    net_income = total_revenue - total_expenses
    
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "revenue": total_revenue,
        "expenses": total_expenses,
        "net_income": net_income
    }

def get_balance_sheet(db: Session, tenant_id: str = None, as_of_date: datetime = None) -> Dict[str, Any]:
    """Get balance sheet as of a specific date"""
    if not as_of_date:
        as_of_date = datetime.utcnow()
    
    # Get asset accounts
    asset_accounts = get_chart_of_accounts_by_type(AccountType.ASSET, db, tenant_id)
    total_assets = 0.0
    assets = []
    
    for account in asset_accounts:
        balance = get_account_balance(str(account.id), db, tenant_id, as_of_date)
        total_assets += balance
        assets.append({
            "account_id": str(account.id),
            "account_name": account.account_name,
            "balance": balance
        })
    
    # Get liability accounts
    liability_accounts = get_chart_of_accounts_by_type(AccountType.LIABILITY, db, tenant_id)
    total_liabilities = 0.0
    liabilities = []
    
    for account in liability_accounts:
        balance = get_account_balance(str(account.id), db, tenant_id, as_of_date)
        total_liabilities += balance
        liabilities.append({
            "account_id": str(account.id),
            "account_name": account.account_name,
            "balance": balance
        })
    
    # Get equity accounts
    equity_accounts = get_chart_of_accounts_by_type(AccountType.EQUITY, db, tenant_id)
    total_equity = 0.0
    equity = []
    
    for account in equity_accounts:
        balance = get_account_balance(str(account.id), db, tenant_id, as_of_date)
        total_equity += balance
        equity.append({
            "account_id": str(account.id),
            "account_name": account.account_name,
            "balance": balance
        })
    
    return {
        "as_of_date": as_of_date,
        "assets": {
            "total": total_assets,
            "accounts": assets
        },
        "liabilities": {
            "total": total_liabilities,
            "accounts": liabilities
        },
        "equity": {
            "total": total_equity,
            "accounts": equity
        },
        "total_liabilities_and_equity": total_liabilities + total_equity
    }
