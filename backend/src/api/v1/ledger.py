from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel
import os
import urllib.parse
import logging

from ...api.dependencies import get_current_user, get_tenant_context
from ...config.database import get_db
from ...models.ledger_models import (
    ChartOfAccountsCreate, ChartOfAccountsUpdate, ChartOfAccountsResponse,
    LedgerTransactionCreate, LedgerTransactionUpdate, LedgerTransactionResponse,
    JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse,
    FinancialPeriodCreate, FinancialPeriodUpdate, FinancialPeriodResponse,
    BudgetCreate, BudgetUpdate, BudgetResponse,
    BudgetItemCreate, BudgetItemUpdate, BudgetItemResponse,
    TrialBalanceResponse, TrialBalanceAccount, IncomeStatementResponse, IncomeStatementPeriod, 
    BalanceSheetResponse, BalanceSheetSection, BalanceSheetAccount,
    AccountReceivableCreate, AccountReceivableUpdate, AccountReceivableResponse, AccountReceivablesListResponse
)
from ...config.ledger_models import (
    TransactionType, TransactionStatus, AccountType, AccountCategory, ChartOfAccounts,
    AccountReceivable, AccountReceivableStatus
)
from ...config.investment_models import Investment, InvestmentStatus
from ...services.email_service import EmailService

logger = logging.getLogger(__name__)
from ...config.ledger_crud import (
    # Chart of Accounts
    create_chart_of_accounts, get_chart_of_accounts_by_id, get_all_chart_of_accounts,
    update_chart_of_accounts, delete_chart_of_accounts, get_chart_of_accounts_by_type,
    get_chart_of_accounts_by_category,
    
    # Ledger Transactions
    create_ledger_transaction, get_ledger_transaction_by_id, get_all_ledger_transactions,
    update_ledger_transaction, delete_ledger_transaction, get_ledger_transactions_by_type,
    get_ledger_transactions_by_account, get_ledger_transactions_by_date_range,
    
    # Journal Entries
    create_journal_entry, get_journal_entry_by_id, get_all_journal_entries,
    update_journal_entry, delete_journal_entry, get_journal_entries_by_status,
    post_journal_entry,
    
    # Financial Periods
    create_financial_period, get_financial_period_by_id, get_all_financial_periods,
    get_current_financial_period, close_financial_period,
    
    # Budgets
    create_budget, get_budget_by_id, get_all_budgets, get_active_budgets,
    update_budget, delete_budget,
    
    # Budget Items
    create_budget_item, get_budget_items_by_budget, update_budget_item, delete_budget_item,
    
    # Financial Reports
    get_trial_balance, get_income_statement, get_balance_sheet, get_account_balance
)
from ...services.ledger_seeding import create_default_chart_of_accounts

router = APIRouter(prefix="/ledger", tags=["ledger"])

# Chart of Accounts Endpoints
@router.post("/chart-of-accounts", response_model=ChartOfAccountsResponse, status_code=status.HTTP_201_CREATED)
async def create_chart_of_accounts_endpoint(
    account: ChartOfAccountsCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create a new chart of accounts entry"""
    try:
        account_data = account.model_dump()
        account_data["tenant_id"] = tenant_context["tenant_id"]
        account_data["created_by"] = current_user.id
        
        db_account = create_chart_of_accounts(account_data, db)
        
        return ChartOfAccountsResponse(
            id=str(db_account.id),
            tenant_id=str(db_account.tenant_id),
            account_code=db_account.account_code,
            account_name=db_account.account_name,
            account_type=db_account.account_type.value,
            account_category=db_account.account_category.value,
            description=db_account.description,
            parent_account_id=str(db_account.parent_account_id) if db_account.parent_account_id else None,
            is_active=db_account.is_active,
            is_system_account=db_account.is_system_account,
            opening_balance=db_account.opening_balance,
            current_balance=db_account.current_balance,
            currency=db_account.currency,
            created_by_id=str(db_account.created_by),
            created_at=db_account.created_at,
            updated_at=db_account.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chart of accounts: {str(e)}")

@router.get("/chart-of-accounts", response_model=List[ChartOfAccountsResponse])
async def get_chart_of_accounts_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=1000),
    account_type: Optional[AccountType] = Query(None),
    account_category: Optional[AccountCategory] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get all chart of accounts for the tenant"""
    try:
        if account_type:
            accounts = get_chart_of_accounts_by_type(account_type, db, tenant_context["tenant_id"])
        elif account_category:
            accounts = get_chart_of_accounts_by_category(account_category, db, tenant_context["tenant_id"])
        else:
            accounts = get_all_chart_of_accounts(db, tenant_context["tenant_id"], skip, limit)
        
        return [
            ChartOfAccountsResponse(
                id=str(account.id),
                tenant_id=str(account.tenant_id),
                account_code=account.account_code,
                account_name=account.account_name,
                account_type=account.account_type.value,
                account_category=account.account_category.value,
                description=account.description,
                parent_account_id=str(account.parent_account_id) if account.parent_account_id else None,
                is_active=account.is_active,
                is_system_account=account.is_system_account,
                opening_balance=account.opening_balance,
                current_balance=account.current_balance,
                currency=account.currency,
                created_by_id=str(account.created_by),
                created_at=account.created_at,
                updated_at=account.updated_at
            ) for account in accounts
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chart of accounts: {str(e)}")

@router.get("/chart-of-accounts/{account_id}", response_model=ChartOfAccountsResponse)
async def get_chart_of_accounts_by_id_endpoint(
    account_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get a specific chart of accounts entry by ID"""
    try:
        account = get_chart_of_accounts_by_id(account_id, db, tenant_context["tenant_id"])
        if not account:
            raise HTTPException(status_code=404, detail="Chart of accounts entry not found")
        
        return ChartOfAccountsResponse(
            id=str(account.id),
            tenant_id=str(account.tenant_id),
            account_code=account.account_code,
            account_name=account.account_name,
            account_type=account.account_type.value,
            account_category=account.account_category.value,
            description=account.description,
            parent_account_id=str(account.parent_account_id) if account.parent_account_id else None,
            is_active=account.is_active,
            is_system_account=account.is_system_account,
            opening_balance=account.opening_balance,
            current_balance=account.current_balance,
            currency=account.currency,
            created_by_id=str(account.created_by),
            created_at=account.created_at,
            updated_at=account.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chart of accounts: {str(e)}")

@router.put("/chart-of-accounts/{account_id}", response_model=ChartOfAccountsResponse)
async def update_chart_of_accounts_endpoint(
    account_id: str,
    account_update: ChartOfAccountsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Update a chart of accounts entry"""
    try:
        update_data = {k: v for k, v in account_update.model_dump().items() if v is not None}
        updated_account = update_chart_of_accounts(account_id, update_data, db, tenant_context["tenant_id"])
        
        if not updated_account:
            raise HTTPException(status_code=404, detail="Chart of accounts entry not found")
        
        return ChartOfAccountsResponse(
            id=str(updated_account.id),
            tenant_id=str(updated_account.tenant_id),
            account_code=updated_account.account_code,
            account_name=updated_account.account_name,
            account_type=updated_account.account_type.value,
            account_category=updated_account.account_category.value,
            description=updated_account.description,
            parent_account_id=str(updated_account.parent_account_id) if updated_account.parent_account_id else None,
            is_active=updated_account.is_active,
            is_system_account=updated_account.is_system_account,
            opening_balance=updated_account.opening_balance,
            current_balance=updated_account.current_balance,
            currency=updated_account.currency,
            created_by_id=str(updated_account.created_by),
            created_at=updated_account.created_at,
            updated_at=updated_account.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update chart of accounts: {str(e)}")

@router.delete("/chart-of-accounts/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chart_of_accounts_endpoint(
    account_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Delete a chart of accounts entry"""
    try:
        success = delete_chart_of_accounts(account_id, db, tenant_context["tenant_id"])
        if not success:
            raise HTTPException(status_code=404, detail="Chart of accounts entry not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete chart of accounts: {str(e)}")


def _apply_meta_data_to_ledger_payload(payload: dict) -> None:
    meta = payload.pop("meta_data", None)
    if not isinstance(meta, dict):
        return
    if "currency" in meta:
        payload["currency"] = meta["currency"]
    if "notes" in meta:
        payload["notes"] = meta["notes"]
    if "tags" in meta:
        payload["tags"] = meta["tags"]
    if "reference_type" in meta:
        payload["reference_type"] = meta["reference_type"]
    if "reference_id" in meta:
        payload["reference_id"] = meta["reference_id"]
    if "attachments" in meta:
        payload["attachments"] = meta["attachments"]
    if "approved_by_id" in meta:
        payload["approved_by"] = meta["approved_by_id"]
    if "journal_entry_id" in meta:
        payload["journal_entry_id"] = meta["journal_entry_id"]


# Ledger Transaction Endpoints
@router.post("/transactions", response_model=LedgerTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_ledger_transaction_endpoint(
    transaction: LedgerTransactionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create a new ledger transaction"""
    try:
        transaction_data = transaction.model_dump()
        transaction_data["tenant_id"] = tenant_context["tenant_id"]
        transaction_data["created_by"] = current_user.id
        
        # Transform field names to match SQLAlchemy model
        if "account_id" in transaction_data:
            transaction_data["debit_account_id"] = transaction_data.pop("account_id")
        if "contra_account_id" in transaction_data:
            transaction_data["credit_account_id"] = transaction_data.pop("contra_account_id")

        _apply_meta_data_to_ledger_payload(transaction_data)

        db_transaction = create_ledger_transaction(transaction_data, db)
        
        return LedgerTransactionResponse(
            id=str(db_transaction.id),
            tenant_id=str(db_transaction.tenant_id),
            transaction_number=db_transaction.transaction_number,
            transaction_date=db_transaction.transaction_date,
            transaction_type=db_transaction.transaction_type.value,
            status=db_transaction.status.value,
            account_id=str(db_transaction.debit_account_id),
            contra_account_id=str(db_transaction.credit_account_id),
            amount=db_transaction.amount,
            description=db_transaction.description,
            reference_number=db_transaction.reference_number,
            meta_data={
                "currency": db_transaction.currency,
                "notes": db_transaction.notes,
                "tags": db_transaction.tags,
                "reference_type": db_transaction.reference_type,
                "reference_id": db_transaction.reference_id,
                "attachments": db_transaction.attachments,
                "approved_by_id": str(db_transaction.approved_by) if db_transaction.approved_by else None,
                "journal_entry_id": str(db_transaction.journal_entry_id) if db_transaction.journal_entry_id else None,
            },
            created_by_id=str(db_transaction.created_by),
            created_at=db_transaction.created_at,
            updated_at=db_transaction.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create ledger transaction: {str(e)}")

@router.get("/transactions", response_model=List[LedgerTransactionResponse])
async def get_ledger_transactions_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    transaction_type: Optional[TransactionType] = Query(None),
    account_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get all ledger transactions for the tenant"""
    try:
        if transaction_type:
            transactions = get_ledger_transactions_by_type(transaction_type, db, tenant_context["tenant_id"], skip, limit)
        elif account_id:
            transactions = get_ledger_transactions_by_account(account_id, db, tenant_context["tenant_id"], skip, limit)
        elif start_date and end_date:
            start_dt = datetime.combine(start_date, datetime.min.time())
            end_dt = datetime.combine(end_date, datetime.max.time())
            transactions = get_ledger_transactions_by_date_range(start_dt, end_dt, db, tenant_context["tenant_id"], skip, limit)
        else:
            transactions = get_all_ledger_transactions(db, tenant_context["tenant_id"], skip, limit)
        
        return [
            LedgerTransactionResponse(
                id=str(txn.id),
                tenant_id=str(txn.tenant_id),
                transaction_number=txn.transaction_number,
                transaction_date=txn.transaction_date,
                transaction_type=txn.transaction_type.value,
                status=txn.status.value,
                account_id=str(txn.debit_account_id),
                contra_account_id=str(txn.credit_account_id),
                amount=txn.amount,
                description=txn.description,
                reference_number=txn.reference_number,
                meta_data={
                    "currency": txn.currency,
                    "notes": txn.notes,
                    "tags": txn.tags,
                    "reference_type": txn.reference_type,
                    "reference_id": txn.reference_id,
                    "attachments": txn.attachments,
                    "approved_by_id": str(txn.approved_by) if txn.approved_by else None,
                    "journal_entry_id": str(txn.journal_entry_id) if txn.journal_entry_id else None,
                },
                created_by_id=str(txn.created_by),
                created_at=txn.created_at,
                updated_at=txn.updated_at
            ) for txn in transactions
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ledger transactions: {str(e)}")

@router.get("/transactions/{transaction_id}", response_model=LedgerTransactionResponse)
async def get_ledger_transaction_by_id_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get a specific ledger transaction by ID"""
    try:
        transaction = get_ledger_transaction_by_id(transaction_id, db, tenant_context["tenant_id"])
        if not transaction:
            raise HTTPException(status_code=404, detail="Ledger transaction not found")
        
        return LedgerTransactionResponse(
            id=str(transaction.id),
            tenant_id=str(transaction.tenant_id),
            transaction_number=transaction.transaction_number,
            transaction_date=transaction.transaction_date,
            transaction_type=transaction.transaction_type.value,
            status=transaction.status.value,
            account_id=str(transaction.debit_account_id),
            contra_account_id=str(transaction.credit_account_id),
            amount=transaction.amount,
            description=transaction.description,
            reference_number=transaction.reference_number,
            meta_data={
                "currency": transaction.currency,
                "notes": transaction.notes,
                "tags": transaction.tags,
                "reference_type": transaction.reference_type,
                "reference_id": transaction.reference_id,
                "attachments": transaction.attachments,
                "approved_by_id": str(transaction.approved_by) if transaction.approved_by else None,
                "journal_entry_id": str(transaction.journal_entry_id) if transaction.journal_entry_id else None,
            },
            created_by_id=str(transaction.created_by),
            created_at=transaction.created_at,
            updated_at=transaction.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ledger transaction: {str(e)}")

@router.put("/transactions/{transaction_id}", response_model=LedgerTransactionResponse)
async def update_ledger_transaction_endpoint(
    transaction_id: str,
    transaction_update: LedgerTransactionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Update a ledger transaction"""
    try:
        update_data = {k: v for k, v in transaction_update.model_dump(exclude_unset=True).items() if v is not None}
        
        # Transform field names to match SQLAlchemy model
        if "account_id" in update_data:
            update_data["debit_account_id"] = update_data.pop("account_id")
        if "contra_account_id" in update_data:
            update_data["credit_account_id"] = update_data.pop("contra_account_id")

        _apply_meta_data_to_ledger_payload(update_data)

        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        updated_transaction = update_ledger_transaction(transaction_id, update_data, db, tenant_context["tenant_id"])
        
        if not updated_transaction:
            raise HTTPException(status_code=404, detail="Ledger transaction not found")
        
        return LedgerTransactionResponse(
            id=str(updated_transaction.id),
            tenant_id=str(updated_transaction.tenant_id),
            transaction_number=updated_transaction.transaction_number,
            transaction_date=updated_transaction.transaction_date,
            transaction_type=updated_transaction.transaction_type.value,
            status=updated_transaction.status.value,
            account_id=str(updated_transaction.debit_account_id),
            contra_account_id=str(updated_transaction.credit_account_id),
            amount=updated_transaction.amount,
            description=updated_transaction.description,
            reference_number=updated_transaction.reference_number,
            meta_data={
                "currency": updated_transaction.currency,
                "notes": updated_transaction.notes,
                "tags": updated_transaction.tags,
                "reference_type": updated_transaction.reference_type,
                "reference_id": updated_transaction.reference_id,
                "attachments": updated_transaction.attachments,
                "approved_by_id": str(updated_transaction.approved_by) if updated_transaction.approved_by else None,
                "journal_entry_id": str(updated_transaction.journal_entry_id) if updated_transaction.journal_entry_id else None,
            },
            created_by_id=str(updated_transaction.created_by),
            created_at=updated_transaction.created_at,
            updated_at=updated_transaction.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update ledger transaction: {str(e)}")

@router.delete("/transactions/{transaction_id}")
async def delete_ledger_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Delete a ledger transaction"""
    try:
        success = delete_ledger_transaction(transaction_id, db, tenant_context["tenant_id"])
        if not success:
            raise HTTPException(status_code=404, detail="Ledger transaction not found")
        
        return {"message": "Ledger transaction deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete ledger transaction: {str(e)}")

# Journal Entry Endpoints
@router.post("/journal-entries", response_model=JournalEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_journal_entry_endpoint(
    entry: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create a new journal entry"""
    try:
        entry_data = entry.model_dump()
        entry_data["tenant_id"] = tenant_context["tenant_id"]
        entry_data["created_by"] = current_user.id
        
        db_entry = create_journal_entry(entry_data, db)
        
        return JournalEntryResponse(
            id=str(db_entry.id),
            tenant_id=str(db_entry.tenant_id),
            entry_number=db_entry.entry_number,
            entry_date=db_entry.entry_date,
            reference_number=db_entry.reference_number,
            description=db_entry.description,
            notes=db_entry.notes,
            status=db_entry.status,
            is_posted=db_entry.is_posted,
            posted_at=db_entry.posted_at,
            posted_by_id=str(db_entry.posted_by) if db_entry.posted_by else None,
            tags=db_entry.tags,
            attachments=db_entry.attachments,
            created_by_id=str(db_entry.created_by),
            created_at=db_entry.created_at,
            updated_at=db_entry.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create journal entry: {str(e)}")

@router.get("/journal-entries", response_model=List[JournalEntryResponse])
async def get_journal_entries_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get all journal entries for the tenant"""
    try:
        if status:
            entries = get_journal_entries_by_status(status, db, tenant_context["tenant_id"], skip, limit)
        else:
            entries = get_all_journal_entries(db, tenant_context["tenant_id"], skip, limit)
        
        return [
            JournalEntryResponse(
                id=str(entry.id),
                tenant_id=str(entry.tenant_id),
                entry_number=entry.entry_number,
                entry_date=entry.entry_date,
                reference_number=entry.reference_number,
                description=entry.description,
                notes=entry.notes,
                status=entry.status,
                is_posted=entry.is_posted,
                posted_at=entry.posted_at,
                posted_by_id=str(entry.posted_by) if entry.posted_by else None,
                tags=entry.tags,
                attachments=entry.attachments,
                created_by_id=str(entry.created_by),
                created_at=entry.created_at,
                updated_at=entry.updated_at
            ) for entry in entries
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch journal entries: {str(e)}")

@router.post("/journal-entries/{entry_id}/post", response_model=JournalEntryResponse)
async def post_journal_entry_endpoint(
    entry_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Post a journal entry"""
    try:
        posted_entry = post_journal_entry(entry_id, db, tenant_context["tenant_id"], str(current_user.id))
        if not posted_entry:
            raise HTTPException(status_code=404, detail="Journal entry not found or already posted")
        
        return JournalEntryResponse(
            id=str(posted_entry.id),
            tenant_id=str(posted_entry.tenant_id),
            entry_number=posted_entry.entry_number,
            entry_date=posted_entry.entry_date,
            reference_number=posted_entry.reference_number,
            description=posted_entry.description,
            notes=posted_entry.notes,
            status=posted_entry.status,
            is_posted=posted_entry.is_posted,
            posted_at=posted_entry.posted_at,
            posted_by_id=str(posted_entry.posted_by) if posted_entry.posted_by else None,
            tags=posted_entry.tags,
            attachments=posted_entry.attachments,
            created_by_id=str(posted_entry.created_by),
            created_at=posted_entry.created_at,
            updated_at=posted_entry.updated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post journal entry: {str(e)}")

# Financial Reports Endpoints
@router.get("/reports/trial-balance", response_model=TrialBalanceResponse)
async def get_trial_balance_endpoint(
    as_of_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get trial balance as of a specific date"""
    try:
        as_of_dt = datetime.combine(as_of_date, datetime.max.time()) if as_of_date else None
        tenant_id = tenant_context["tenant_id"]
        
        trial_balance_data = get_trial_balance(db, tenant_id, as_of_dt)
        
        # Convert the data to match the response model
        trial_balance_accounts = [
            TrialBalanceAccount(**account_data) for account_data in trial_balance_data
        ]
        
        return TrialBalanceResponse(
            as_of_date=as_of_dt or datetime.utcnow(),
            accounts=trial_balance_accounts
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch trial balance: {str(e)}")

@router.get("/reports/income-statement", response_model=IncomeStatementResponse)
async def get_income_statement_endpoint(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get income statement for a date range"""
    try:
        start_dt = datetime.combine(start_date, datetime.min.time()) if start_date else None
        end_dt = datetime.combine(end_date, datetime.max.time()) if end_date else None
        
        income_statement_data = get_income_statement(db, tenant_context["tenant_id"], start_dt, end_dt)
        
        # Convert the period data to match the response model
        period = IncomeStatementPeriod(
            start_date=income_statement_data["period"]["start_date"],
            end_date=income_statement_data["period"]["end_date"]
        )
        
        return IncomeStatementResponse(
            period=period,
            revenue=income_statement_data["revenue"],
            expenses=income_statement_data["expenses"],
            net_income=income_statement_data["net_income"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch income statement: {str(e)}")

@router.get("/reports/balance-sheet", response_model=BalanceSheetResponse)
async def get_balance_sheet_endpoint(
    as_of_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get balance sheet as of a specific date"""
    try:
        as_of_dt = datetime.combine(as_of_date, datetime.max.time()) if as_of_date else None
        balance_sheet_data = get_balance_sheet(db, tenant_context["tenant_id"], as_of_dt)
        
        # Convert the data to match the response model
        assets = BalanceSheetSection(
            total=balance_sheet_data["assets"]["total"],
            accounts=[BalanceSheetAccount(**account) for account in balance_sheet_data["assets"]["accounts"]]
        )
        
        liabilities = BalanceSheetSection(
            total=balance_sheet_data["liabilities"]["total"],
            accounts=[BalanceSheetAccount(**account) for account in balance_sheet_data["liabilities"]["accounts"]]
        )
        
        equity = BalanceSheetSection(
            total=balance_sheet_data["equity"]["total"],
            accounts=[BalanceSheetAccount(**account) for account in balance_sheet_data["equity"]["accounts"]]
        )
        
        return BalanceSheetResponse(
            as_of_date=balance_sheet_data["as_of_date"],
            assets=assets,
            liabilities=liabilities,
            equity=equity,
            total_liabilities_and_equity=balance_sheet_data["total_liabilities_and_equity"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch balance sheet: {str(e)}")

# Budget Endpoints
@router.post("/budgets", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget_endpoint(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create a new budget"""
    try:
        budget_data = budget.model_dump()
        budget_data["tenant_id"] = tenant_context["tenant_id"]
        budget_data["created_by"] = current_user.id
        
        db_budget = create_budget(budget_data, db)
        
        return BudgetResponse(
            id=str(db_budget.id),
            tenant_id=str(db_budget.tenant_id),
            budget_name=db_budget.budget_name,
            budget_type=db_budget.budget_type,
            start_date=db_budget.start_date,
            end_date=db_budget.end_date,
            total_budget=db_budget.total_budget,
            allocated_amount=db_budget.allocated_amount,
            spent_amount=db_budget.spent_amount,
            remaining_amount=db_budget.remaining_amount,
            status=db_budget.status,
            is_active=db_budget.is_active,
            description=db_budget.description,
            notes=db_budget.notes,
            created_by_id=str(db_budget.created_by),
            created_at=db_budget.created_at,
            updated_at=db_budget.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create budget: {str(e)}")

@router.get("/budgets", response_model=List[BudgetResponse])
async def get_budgets_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get all budgets for the tenant"""
    try:
        if active_only:
            budgets = get_active_budgets(db, tenant_context["tenant_id"])
        else:
            budgets = get_all_budgets(db, tenant_context["tenant_id"], skip, limit)
        
        return [
            BudgetResponse(
                id=str(budget.id),
                tenant_id=str(budget.tenant_id),
                budget_name=budget.budget_name,
                budget_type=budget.budget_type,
                start_date=budget.start_date,
                end_date=budget.end_date,
                total_budget=budget.total_budget,
                allocated_amount=budget.allocated_amount,
                spent_amount=budget.spent_amount,
                remaining_amount=budget.remaining_amount,
                status=budget.status,
                is_active=budget.is_active,
                description=budget.description,
                notes=budget.notes,
                created_by_id=str(budget.created_by),
                created_at=budget.created_at,
                updated_at=budget.updated_at
            ) for budget in budgets
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch budgets: {str(e)}")

# Account Balance Endpoint
@router.get("/accounts/{account_id}/balance")
async def get_account_balance_endpoint(
    account_id: str,
    as_of_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get account balance as of a specific date"""
    try:
        as_of_dt = datetime.combine(as_of_date, datetime.max.time()) if as_of_date else None
        balance = get_account_balance(account_id, db, tenant_context["tenant_id"], as_of_dt)
        
        return {
            "account_id": account_id,
            "as_of_date": as_of_dt or datetime.utcnow(),
            "balance": balance
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch account balance: {str(e)}")

# Profit/Loss Dashboard Endpoint
@router.get("/profit-loss-dashboard")
async def get_profit_loss_dashboard(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get comprehensive profit/loss dashboard data"""
    try:
        from ...models.invoices import Invoice, Payment
        from ...config.inventory_models import PurchaseOrder, StockMovement, Product
        from ...config.sales_models import Quote, Contract
        
        tenant_id = tenant_context["tenant_id"]
        
        # Calculate date range based on period
        today = datetime.utcnow().date()
        if period == "day":
            start_dt = today
            end_dt = today
        elif period == "week":
            start_dt = today - timedelta(days=today.weekday())
            end_dt = start_dt + timedelta(days=6)
        elif period == "month":
            start_dt = today.replace(day=1)
            if start_dt.month == 12:
                end_dt = start_dt.replace(year=start_dt.year + 1, month=1) - timedelta(days=1)
            else:
                end_dt = start_dt.replace(month=start_dt.month + 1) - timedelta(days=1)
        elif period == "year":
            start_dt = today.replace(month=1, day=1)
            end_dt = today.replace(month=12, day=31)
        
        # Override with provided dates if available
        if start_date:
            start_dt = start_date
        if end_date:
            end_dt = end_date
        
        # Convert to datetime for database queries
        start_datetime = datetime.combine(start_dt, datetime.min.time())
        end_datetime = datetime.combine(end_dt, datetime.max.time())
        
        # Sales/Revenue Data
        invoices_query = db.query(Invoice).filter(
            Invoice.tenant_id == tenant_id,
            Invoice.createdAt >= start_datetime,
            Invoice.createdAt <= end_datetime
        )
        
        total_invoices = invoices_query.count()
        total_sales = invoices_query.with_entities(func.sum(Invoice.total)).scalar() or 0
        paid_invoices = invoices_query.filter(Invoice.status == "paid").count()
        pending_invoices = invoices_query.filter(Invoice.status.in_(["draft", "sent", "viewed"])).count()
        overdue_invoices = invoices_query.filter(Invoice.status == "overdue").count()
        
        # Payments received
        payments_query = db.query(Payment).join(Invoice).filter(
            Invoice.tenant_id == tenant_id,
            Payment.createdAt >= start_datetime,
            Payment.createdAt <= end_datetime
        )
        total_payments_received = payments_query.with_entities(func.sum(Payment.amount)).scalar() or 0
        
        # Purchase/Expense Data
        purchase_orders_query = db.query(PurchaseOrder).filter(
            PurchaseOrder.tenant_id == tenant_id,
            PurchaseOrder.createdAt >= start_datetime,
            PurchaseOrder.createdAt <= end_datetime
        )
        
        total_purchase_orders = purchase_orders_query.count()
        total_purchases = purchase_orders_query.with_entities(func.sum(PurchaseOrder.totalAmount)).scalar() or 0
        completed_purchases = purchase_orders_query.filter(PurchaseOrder.status == "received").count()
        pending_purchases = purchase_orders_query.filter(PurchaseOrder.status.in_(["draft", "submitted", "approved", "ordered"])).count()
        
        # Inventory Value
        inventory_query = db.query(Product).filter(
            Product.tenant_id == tenant_id,
            Product.isActive == True
        )
        total_inventory_value = inventory_query.with_entities(
            func.sum(Product.stockQuantity * Product.costPerUnitPrice)
        ).scalar() or 0
        total_products = inventory_query.count()
        
        # Stock Movements
        stock_movements_query = db.query(StockMovement).filter(
            StockMovement.tenant_id == tenant_id,
            StockMovement.createdAt >= start_datetime,
            StockMovement.createdAt <= end_datetime
        )
        
        inbound_movements = stock_movements_query.filter(StockMovement.movementType == "inbound").count()
        outbound_movements = stock_movements_query.filter(StockMovement.movementType == "outbound").count()
        
        # Calculate Profit/Loss
        gross_profit = total_sales - total_purchases
        net_profit = total_payments_received - total_purchases
        
        # Total Investments
        total_investments_query = db.query(Investment).filter(
            Investment.tenant_id == tenant_id,
            Investment.status == InvestmentStatus.COMPLETED
        )
        total_investments = total_investments_query.with_entities(func.sum(Investment.amount)).scalar() or 0
        
        # Real Profit After Investment
        real_profit = net_profit - total_investments
        
        # Quotes/Contracts
        quotes_query = db.query(Quote).filter(
            Quote.tenant_id == tenant_id,
            Quote.createdAt >= start_datetime,
            Quote.createdAt <= end_datetime
        )
        total_quotes = quotes_query.count()
        quotes_value = quotes_query.with_entities(func.sum(Quote.total)).scalar() or 0
        
        contracts_query = db.query(Contract).filter(
            Contract.tenant_id == tenant_id,
            Contract.createdAt >= start_datetime,
            Contract.createdAt <= end_datetime
        )
        total_contracts = contracts_query.count()
        contracts_value = contracts_query.with_entities(func.sum(Contract.value)).scalar() or 0
        
        # Daily breakdown for charts
        daily_data = []
        current_date = start_dt
        while current_date <= end_dt:
            day_start = datetime.combine(current_date, datetime.min.time())
            day_end = datetime.combine(current_date, datetime.max.time())
            
            day_sales = db.query(Invoice).filter(
                Invoice.tenant_id == tenant_id,
                Invoice.createdAt >= day_start,
                Invoice.createdAt <= day_end
            ).with_entities(func.sum(Invoice.total)).scalar() or 0
            
            day_purchases = db.query(PurchaseOrder).filter(
                PurchaseOrder.tenant_id == tenant_id,
                PurchaseOrder.createdAt >= day_start,
                PurchaseOrder.createdAt <= day_end
            ).with_entities(func.sum(PurchaseOrder.totalAmount)).scalar() or 0
            
            daily_data.append({
                "date": current_date.isoformat(),
                "sales": day_sales,
                "purchases": day_purchases,
                "profit": day_sales - day_purchases
            })
            
            current_date += timedelta(days=1)
        
        return {
            "period": period,
            "start_date": start_dt.isoformat(),
            "end_date": end_dt.isoformat(),
            "summary": {
                "total_sales": total_sales,
                "total_purchases": total_purchases,
                "gross_profit": gross_profit,
                "net_profit": net_profit,
                "total_payments_received": total_payments_received,
                "inventory_value": total_inventory_value,
                "total_investments": total_investments,
                "profit_after_investment": real_profit
            },
            "sales": {
                "total_invoices": total_invoices,
                "paid_invoices": paid_invoices,
                "pending_invoices": pending_invoices,
                "overdue_invoices": overdue_invoices,
                "total_sales": total_sales,
                "total_payments_received": total_payments_received
            },
            "purchases": {
                "total_purchase_orders": total_purchase_orders,
                "completed_purchases": completed_purchases,
                "pending_purchases": pending_purchases,
                "total_purchases": total_purchases
            },
            "inventory": {
                "total_products": total_products,
                "total_inventory_value": total_inventory_value,
                "inbound_movements": inbound_movements,
                "outbound_movements": outbound_movements
            },
            "quotes_contracts": {
                "total_quotes": total_quotes,
                "quotes_value": quotes_value,
                "total_contracts": total_contracts,
                "contracts_value": contracts_value
            },
            "daily_breakdown": daily_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profit/loss dashboard: {str(e)}")

class SendProfitLossReportRequest(BaseModel):
    to_email: Optional[str] = None
    message: Optional[str] = None

class SendProfitLossWhatsAppRequest(BaseModel):
    phone_number: Optional[str] = None

@router.post("/profit-loss-dashboard/send-email")
async def send_profit_loss_report_email(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    request: Optional[SendProfitLossReportRequest] = Body(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Send profit/loss report via email"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        to_email = None
        if request and request.to_email:
            to_email = request.to_email
        else:
            raise HTTPException(status_code=400, detail="Email address is required to send report")
        
        dashboard_data = await get_profit_loss_dashboard(
            period=period,
            start_date=start_date,
            end_date=end_date,
            db=db,
            current_user=current_user,
            tenant_context=tenant_context
        )
        
        period_label = period.title()
        if start_date and end_date:
            period_label = f"{start_date} to {end_date}"
        
        summary = dashboard_data.get("summary", {})
        sales = dashboard_data.get("sales", {})
        purchases = dashboard_data.get("purchases", {})
        inventory = dashboard_data.get("inventory", {})
        
        custom_message = request.message if request and request.message else None
        custom_message_section = f"\n\n{custom_message}\n" if custom_message else ""
        
        email_body = f"""Profit & Loss Report - {period_label}

Report Period: {dashboard_data.get('start_date', 'N/A')} to {dashboard_data.get('end_date', 'N/A')}

SUMMARY:
• Total Sales: {summary.get('total_sales', 0):.2f}
• Total Purchases: {summary.get('total_purchases', 0):.2f}
• Total Investments: {summary.get('total_investments', 0):.2f}
• Net Profit: {summary.get('net_profit', 0):.2f}
• Profit After Investment: {summary.get('profit_after_investment', 0):.2f}
• Inventory Value: {summary.get('inventory_value', 0):.2f}

SALES OVERVIEW:
• Total Invoices: {sales.get('total_invoices', 0)}
• Paid Invoices: {sales.get('paid_invoices', 0)}
• Pending Invoices: {sales.get('pending_invoices', 0)}
• Overdue Invoices: {sales.get('overdue_invoices', 0)}
• Total Payments Received: {sales.get('total_payments_received', 0):.2f}

PURCHASES OVERVIEW:
• Total Purchase Orders: {purchases.get('total_purchase_orders', 0)}
• Completed Purchases: {purchases.get('completed_purchases', 0)}
• Pending Purchases: {purchases.get('pending_purchases', 0)}
• Total Purchases: {purchases.get('total_purchases', 0):.2f}

INVENTORY OVERVIEW:
• Total Products: {inventory.get('total_products', 0)}
• Total Inventory Value: {inventory.get('total_inventory_value', 0):.2f}
• Inbound Movements: {inventory.get('inbound_movements', 0)}
• Outbound Movements: {inventory.get('outbound_movements', 0)}
{custom_message_section}
This report was generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}.

Best regards,
BizTrack Team"""
        
        email_service = EmailService()
        email_sent = email_service.send_report_email(
            to_email=to_email,
            subject=f"Profit & Loss Report - {period_label}",
            body=email_body
        )
        
        if email_sent:
            return {"message": f"Profit/Loss report sent successfully to {to_email}"}
        else:
            return {
                "message": "Report could not be sent. Please check SMTP configuration.",
                "warning": "SMTP credentials not configured"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send profit/loss report via email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send report: {str(e)}")

@router.post("/profit-loss-dashboard/send-whatsapp")
async def send_profit_loss_report_whatsapp(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    request: Optional[SendProfitLossWhatsAppRequest] = Body(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get WhatsApp message and link for sending profit/loss report"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        phone_number = None
        if request and request.phone_number:
            phone_number = request.phone_number
        else:
            raise HTTPException(status_code=400, detail="Phone number is required to send via WhatsApp")
        
        dashboard_data = await get_profit_loss_dashboard(
            period=period,
            start_date=start_date,
            end_date=end_date,
            db=db,
            current_user=current_user,
            tenant_context=tenant_context
        )
        
        period_label = period.title()
        if start_date and end_date:
            period_label = f"{start_date} to {end_date}"
        
        summary = dashboard_data.get("summary", {})
        sales = dashboard_data.get("sales", {})
        purchases = dashboard_data.get("purchases", {})
        inventory = dashboard_data.get("inventory", {})
        
        message = f"""📊 *Profit/Loss Report - {period_label}*

*Report Period:* {dashboard_data.get('start_date', 'N/A')} to {dashboard_data.get('end_date', 'N/A')}

💰 *SUMMARY:*
• Total Sales: {summary.get('total_sales', 0):.2f}
• Total Purchases: {summary.get('total_purchases', 0):.2f}
• Total Investments: {summary.get('total_investments', 0):.2f}
• Net Profit: {summary.get('net_profit', 0):.2f}
• Profit After Investment: {summary.get('profit_after_investment', 0):.2f}
• Inventory Value: {summary.get('inventory_value', 0):.2f}

📈 *SALES:*
• Total Invoices: {sales.get('total_invoices', 0)}
• Paid: {sales.get('paid_invoices', 0)}
• Pending: {sales.get('pending_invoices', 0)}
• Overdue: {sales.get('overdue_invoices', 0)}
• Payments Received: {sales.get('total_payments_received', 0):.2f}

📦 *PURCHASES:*
• Total Orders: {purchases.get('total_purchase_orders', 0)}
• Completed: {purchases.get('completed_purchases', 0)}
• Pending: {purchases.get('pending_purchases', 0)}
• Total Value: {purchases.get('total_purchases', 0):.2f}

📊 *INVENTORY:*
• Products: {inventory.get('total_products', 0)}
• Value: {inventory.get('total_inventory_value', 0):.2f}
• Inbound: {inventory.get('inbound_movements', 0)}
• Outbound: {inventory.get('outbound_movements', 0)}

Generated on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"""
        
        cleaned_phone = phone_number.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        whatsapp_url = f"https://wa.me/{cleaned_phone}?text={urllib.parse.quote(message)}"
        
        return {
            "message": "WhatsApp link generated successfully",
            "whatsapp_url": whatsapp_url,
            "phone_number": phone_number,
            "formatted_message": message
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate WhatsApp link for profit/loss report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate WhatsApp link: {str(e)}")

@router.post("/account-receivables", response_model=AccountReceivableResponse, status_code=status.HTTP_201_CREATED)
async def create_account_receivable_endpoint(
    ar_data: AccountReceivableCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    try:
        db_ar = AccountReceivable(
            tenant_id=tenant_context["tenant_id"],
            invoice_id=ar_data.invoice_id,
            invoice_number=ar_data.invoice_number,
            customer_id=ar_data.customer_id,
            customer_name=ar_data.customer_name,
            customer_email=ar_data.customer_email,
            customer_phone=ar_data.customer_phone,
            invoice_date=ar_data.invoice_date,
            due_date=ar_data.due_date,
            invoice_amount=ar_data.invoice_amount,
            amount_paid=ar_data.amount_paid,
            outstanding_balance=ar_data.outstanding_balance,
            currency=ar_data.currency,
            status=ar_data.status,
            payment_terms=ar_data.payment_terms,
            notes=ar_data.notes,
            days_overdue=ar_data.days_overdue,
            created_by=current_user.id
        )
        db.add(db_ar)
        db.commit()
        db.refresh(db_ar)
        return db_ar
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create account receivable: {str(e)}")

@router.get("/account-receivables", response_model=AccountReceivablesListResponse)
async def get_account_receivables_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[AccountReceivableStatus] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    try:
        query = db.query(AccountReceivable).filter(AccountReceivable.tenant_id == tenant_context["tenant_id"])
        if status:
            query = query.filter(AccountReceivable.status == status)
        
        total = query.count()
        ars = query.offset(skip).limit(limit).all()
        
        total_outstanding = sum(ar.outstanding_balance for ar in ars if ar.status in [AccountReceivableStatus.PENDING, AccountReceivableStatus.PARTIALLY_PAID])
        total_overdue = sum(ar.outstanding_balance for ar in ars if ar.status == AccountReceivableStatus.OVERDUE)
        
        return AccountReceivablesListResponse(
            account_receivables=ars,
            total=total,
            total_outstanding=total_outstanding,
            total_overdue=total_overdue
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch account receivables: {str(e)}")

@router.get("/account-receivables/{ar_id}", response_model=AccountReceivableResponse)
async def get_account_receivable_endpoint(
    ar_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    try:
        ar = db.query(AccountReceivable).filter(
            AccountReceivable.id == ar_id,
            AccountReceivable.tenant_id == tenant_context["tenant_id"]
        ).first()
        if not ar:
            raise HTTPException(status_code=404, detail="Account receivable not found")
        return ar
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch account receivable: {str(e)}")

@router.put("/account-receivables/{ar_id}", response_model=AccountReceivableResponse)
async def update_account_receivable_endpoint(
    ar_id: str,
    ar_data: AccountReceivableUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    try:
        ar = db.query(AccountReceivable).filter(
            AccountReceivable.id == ar_id,
            AccountReceivable.tenant_id == tenant_context["tenant_id"]
        ).first()
        if not ar:
            raise HTTPException(status_code=404, detail="Account receivable not found")
        
        update_data = ar_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(ar, key, value)
        
        db.commit()
        db.refresh(ar)
        return ar
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update account receivable: {str(e)}")

@router.delete("/account-receivables/{ar_id}")
async def delete_account_receivable_endpoint(
    ar_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    try:
        ar = db.query(AccountReceivable).filter(
            AccountReceivable.id == ar_id,
            AccountReceivable.tenant_id == tenant_context["tenant_id"]
        ).first()
        if not ar:
            raise HTTPException(status_code=404, detail="Account receivable not found")
        
        db.delete(ar)
        db.commit()
        return {"message": "Account receivable deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete account receivable: {str(e)}")

@router.get("/test")
async def test_endpoint():
    return {"message": "Ledger API is working", "timestamp": datetime.utcnow()}

# Simple seeding endpoint without tenant context for testing
@router.post("/seed-accounts-simple")
async def seed_accounts_simple():
    """Simple seeding endpoint for testing"""
    return {
        "success": True,
        "message": "Simple seeding endpoint is working",
        "test": True
    }

# Manual Account Seeding Endpoint
@router.post("/seed-accounts")
async def seed_default_accounts_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Manually seed default chart of accounts for the tenant"""
    try:
        tenant_id = tenant_context["tenant_id"]
        created_by = str(current_user.id)
        
        # Check if accounts already exist
        existing_accounts = db.query(ChartOfAccounts).filter(
            ChartOfAccounts.tenant_id == tenant_id
        ).count()
        
        if existing_accounts > 0:
            return {
                "success": False,
                "message": f"Tenant already has {existing_accounts} accounts. Seeding not needed.",
                "existing_accounts": existing_accounts
            }
        
        # Create default accounts
        created_accounts = create_default_chart_of_accounts(tenant_id, created_by, db)
        
        return {
            "success": True,
            "message": f"Successfully created {len(created_accounts)} default accounts",
            "created_accounts": len(created_accounts),
            "accounts": [
                {
                    "account_code": acc.account_code,
                    "account_name": acc.account_name,
                    "account_type": acc.account_type.value
                } for acc in created_accounts
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed default accounts: {str(e)}")
