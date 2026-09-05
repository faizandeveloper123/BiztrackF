"""
Banking API Endpoints
"""

import uuid
from typing import Optional, Any, Dict
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ....config.database import get_db
from ....api.dependencies import get_current_user, get_tenant_context
from ....config.core_models import User
from ....models.banking import (
    BankTransaction,
    TransactionType as DbTransactionType,
    TransactionStatus as DbTransactionStatus,
    PaymentMethod as DbPaymentMethod,
)
from .schemas import (
    BankAccount, BankAccountCreate, BankAccountUpdate, BankAccountResponse, BankAccountsResponse,
    BankTransaction as BankTransactionSchema, BankTransactionCreate, BankTransactionUpdate,
    BankTransactionResponse, BankTransactionsResponse,
    CashPositionResponse,
    BankingDashboard, ReconciliationSummary, TransactionReconciliation,
    TransactionType, TransactionStatus,
    TillCreate, TillUpdate, TillResponse, TillsResponse,
    TillTransactionCreate, TillTransactionUpdate, TillTransactionResponse, TillTransactionsResponse,
)
from . import logic
from .logic import _normalize_enum_input

router = APIRouter(prefix="/banking", tags=["Banking"])


def _pydantic_body_dict(model: Any) -> Dict[str, Any]:
    if hasattr(model, "model_dump"):
        return model.model_dump(mode="python")
    return model.dict()


def _coerce_bank_transaction_row_enums(data: Dict[str, Any]) -> None:
    for field, cls in (
        ("transaction_type", DbTransactionType),
        ("status", DbTransactionStatus),
        ("payment_method", DbPaymentMethod),
    ):
        if field not in data or data.get(field) is None:
            continue
        data[field] = _normalize_enum_input(data.get(field), cls)


def _pydantic_bank_account_from_orm(orm) -> BankAccount:
    from sqlalchemy.inspection import inspect as sa_inspect
    d = {a.key: getattr(orm, a.key) for a in sa_inspect(orm).mapper.column_attrs}
    return BankAccount.model_validate(d)


def _pydantic_bank_transaction_from_orm(orm: BankTransaction) -> BankTransactionSchema:
    from sqlalchemy.inspection import inspect as sa_inspect
    d = {a.key: getattr(orm, a.key) for a in sa_inspect(orm).mapper.column_attrs}
    if d.get("tags") is None:
        d["tags"] = []
    if d.get("attachments") is None:
        d["attachments"] = []
    return BankTransactionSchema.model_validate(d)


# Bank Account Endpoints
@router.post("/accounts", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
def create_bank_account_endpoint(
    account: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new bank account"""
    try:
        account_data = account.dict()
        account_data.update({
            "id": str(uuid.uuid4()),
            "tenant_id": str(tenant_context["tenant_id"]),
            "created_by": str(current_user.id),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        db_account = logic.create_bank_account(account_data, db)
        return BankAccountResponse(bank_account=_pydantic_bank_account_from_orm(db_account))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bank account: {str(e)}")


@router.get("/accounts", response_model=BankAccountsResponse)
def get_bank_accounts_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all bank accounts"""
    try:
        if active_only:
            accounts = logic.get_active_bank_accounts(db, str(tenant_context["tenant_id"]))
        else:
            accounts = logic.get_all_bank_accounts(db, str(tenant_context["tenant_id"]), skip, limit)

        paccounts = [_pydantic_bank_account_from_orm(a) for a in accounts]
        return BankAccountsResponse(bank_accounts=paccounts, total=len(paccounts))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch bank accounts: {str(e)}")


@router.get("/accounts/{account_id}", response_model=BankAccountResponse)
def get_bank_account_endpoint(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific bank account"""
    account = logic.get_bank_account_by_id(account_id, db, str(tenant_context["tenant_id"]))
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    return BankAccountResponse(bank_account=_pydantic_bank_account_from_orm(account))


@router.put("/accounts/{account_id}", response_model=BankAccountResponse)
def update_bank_account_endpoint(
    account_id: str,
    account: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update a bank account"""
    try:
        account_data = account.dict(exclude_unset=True)
        account_data["updated_at"] = datetime.utcnow()

        db_account = logic.update_bank_account(account_id, account_data, db, str(tenant_context["tenant_id"]))
        if not db_account:
            raise HTTPException(status_code=404, detail="Bank account not found")

        return BankAccountResponse(bank_account=_pydantic_bank_account_from_orm(db_account))

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bank account: {str(e)}")


@router.delete("/accounts/{account_id}")
def delete_bank_account_endpoint(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a bank account (soft delete)"""
    success = logic.delete_bank_account(account_id, db, str(tenant_context["tenant_id"]))
    if not success:
        raise HTTPException(status_code=404, detail="Bank account not found")

    return {"message": "Bank account deleted successfully"}


# Bank Transaction Endpoints
@router.post("/transactions", response_model=BankTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_bank_transaction_endpoint(
    transaction: BankTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new bank transaction"""
    try:
        transaction_number = f"BT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

        transaction_data = _pydantic_body_dict(transaction)
        transaction_data.update({
            "id": str(uuid.uuid4()),
            "tenant_id": str(tenant_context["tenant_id"]),
            "transaction_number": transaction_number,
            "created_by": str(current_user.id),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        _coerce_bank_transaction_row_enums(transaction_data)

        db_transaction = logic.create_bank_transaction(transaction_data, db)
        return BankTransactionResponse(
            bank_transaction=_pydantic_bank_transaction_from_orm(db_transaction)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bank transaction: {str(e)}")


@router.get("/transactions", response_model=BankTransactionsResponse)
def get_bank_transactions_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    account_id: Optional[str] = Query(None),
    transaction_type: Optional[TransactionType] = Query(None),
    status: Optional[TransactionStatus] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get bank transactions with optional filters"""
    try:
        transactions = logic.get_all_bank_transactions(
            db, str(tenant_context["tenant_id"]), skip, limit,
            account_id, transaction_type, status, start_date, end_date
        )

        serialized = [_pydantic_bank_transaction_from_orm(t) for t in transactions]
        return BankTransactionsResponse(bank_transactions=serialized, total=len(serialized))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch bank transactions: {str(e)}")


@router.get("/transactions/{transaction_id}", response_model=BankTransactionResponse)
def get_bank_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific bank transaction"""
    transaction = logic.get_bank_transaction_by_id(transaction_id, db, str(tenant_context["tenant_id"]))
    if not transaction:
        raise HTTPException(status_code=404, detail="Bank transaction not found")

    return BankTransactionResponse(
        bank_transaction=_pydantic_bank_transaction_from_orm(transaction)
    )


@router.put("/transactions/{transaction_id}", response_model=BankTransactionResponse)
def update_bank_transaction_endpoint(
    transaction_id: str,
    transaction: BankTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update a bank transaction"""
    try:
        if hasattr(transaction, "model_dump"):
            transaction_data = transaction.model_dump(exclude_unset=True, mode="python")
        else:
            transaction_data = transaction.dict(exclude_unset=True)
        transaction_data["updated_at"] = datetime.utcnow()
        _coerce_bank_transaction_row_enums(transaction_data)

        db_transaction = logic.update_bank_transaction(transaction_id, transaction_data, db, str(tenant_context["tenant_id"]))
        if not db_transaction:
            raise HTTPException(status_code=404, detail="Bank transaction not found")

        return BankTransactionResponse(
            bank_transaction=_pydantic_bank_transaction_from_orm(db_transaction)
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bank transaction: {str(e)}")


@router.delete("/transactions/{transaction_id}")
def delete_bank_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a bank transaction"""
    try:
        success = logic.delete_bank_transaction(transaction_id, db, str(tenant_context["tenant_id"]))
        if not success:
            raise HTTPException(status_code=404, detail="Bank transaction not found")

        return {"message": "Bank transaction deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete bank transaction: {str(e)}")


@router.post("/transactions/{transaction_id}/reconcile")
def reconcile_transaction_endpoint(
    transaction_id: str,
    reconciliation: TransactionReconciliation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Reconcile a bank transaction"""
    try:
        db_transaction = logic.reconcile_transaction(
            transaction_id, str(current_user.id), reconciliation.notes,
            db, str(tenant_context["tenant_id"])
        )

        if not db_transaction:
            raise HTTPException(status_code=404, detail="Bank transaction not found")

        return {"message": "Transaction reconciled successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reconcile transaction: {str(e)}")


# Cash Position Endpoints
@router.get("/cash-position", response_model=CashPositionResponse)
def get_latest_cash_position_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get the latest cash position"""
    try:
        position = logic.get_latest_cash_position(db, str(tenant_context["tenant_id"]))
        if not position:
            raise HTTPException(status_code=404, detail="No cash position found")

        return CashPositionResponse(cash_position=position)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cash position: {str(e)}")


@router.get("/cash-position/{position_date}", response_model=CashPositionResponse)
def get_cash_position_by_date_endpoint(
    position_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get cash position by specific date"""
    try:
        position = logic.get_cash_position_by_date(position_date, db, str(tenant_context["tenant_id"]))
        if not position:
            raise HTTPException(status_code=404, detail="Cash position not found for this date")

        return CashPositionResponse(cash_position=position)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cash position: {str(e)}")


# Dashboard Endpoint
@router.get("/dashboard", response_model=BankingDashboard)
def get_banking_dashboard_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get banking dashboard data"""
    try:
        dashboard_data = logic.get_banking_dashboard_data(db, str(tenant_context["tenant_id"]))
        dashboard_data["recent_transactions"] = [
            _pydantic_bank_transaction_from_orm(t)
            for t in dashboard_data["recent_transactions"]
        ]
        return BankingDashboard(**dashboard_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch banking dashboard: {str(e)}")


# Account Balance Endpoint
@router.get("/accounts/{account_id}/balance")
def get_account_balance_endpoint(
    account_id: str,
    as_of_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get account balance"""
    try:
        account = logic.get_bank_account_by_id(account_id, db, str(tenant_context["tenant_id"]))
        if not account:
            raise HTTPException(status_code=404, detail="Bank account not found")

        balance_data = logic.calculate_account_balance(account_id, db, str(tenant_context["tenant_id"]), as_of_date)
        return balance_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate account balance: {str(e)}")


# Reconciliation Endpoint
@router.get("/reconciliation/summary", response_model=ReconciliationSummary)
def get_reconciliation_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get reconciliation summary"""
    try:
        tenant_id = str(tenant_context["tenant_id"])

        total_transactions = db.query(func.count(BankTransaction.id)).filter(
            BankTransaction.tenant_id == tenant_id
        ).scalar() or 0

        unreconciled_count = db.query(func.count(BankTransaction.id)).filter(
            and_(
                BankTransaction.tenant_id == tenant_id,
                BankTransaction.is_reconciled == False
            )
        ).scalar() or 0

        reconciled_count = total_transactions - unreconciled_count
        reconciliation_percentage = (reconciled_count / total_transactions * 100) if total_transactions > 0 else 0

        last_reconciliation = db.query(func.max(BankTransaction.reconciled_date)).filter(
            and_(
                BankTransaction.tenant_id == tenant_id,
                BankTransaction.is_reconciled == True
            )
        ).scalar()

        return ReconciliationSummary(
            total_transactions=total_transactions,
            reconciled_transactions=reconciled_count,
            unreconciled_transactions=unreconciled_count,
            reconciliation_percentage=round(reconciliation_percentage, 2),
            last_reconciliation_date=last_reconciliation
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reconciliation summary: {str(e)}")


# ========================================
# Till Endpoints
# ========================================

@router.post("/tills", response_model=TillResponse, status_code=status.HTTP_201_CREATED)
def create_till_endpoint(
    till: TillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new till"""
    try:
        till_data = till.dict()
        till_data["tenant_id"] = tenant_context["tenant_id"]
        till_data["created_by"] = current_user.id
        till_data["id"] = str(uuid.uuid4())

        db_till = logic.create_till(till_data, db)
        return TillResponse(till=db_till)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create till: {str(e)}")


@router.get("/tills", response_model=TillsResponse)
def get_tills_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all tills"""
    try:
        tills = logic.get_all_tills(db, str(tenant_context["tenant_id"]), skip, limit)
        return TillsResponse(tills=tills, total=len(tills))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tills: {str(e)}")


@router.get("/tills/{till_id}", response_model=TillResponse)
def get_till_endpoint(
    till_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get till by ID"""
    try:
        till = logic.get_till_by_id(till_id, db, str(tenant_context["tenant_id"]))
        if not till:
            raise HTTPException(status_code=404, detail="Till not found")

        return TillResponse(till=till)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch till: {str(e)}")


@router.put("/tills/{till_id}", response_model=TillResponse)
def update_till_endpoint(
    till_id: str,
    till_update: TillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update till"""
    try:
        update_data = till_update.dict(exclude_unset=True)
        till = logic.update_till(till_id, update_data, db, str(tenant_context["tenant_id"]))

        if not till:
            raise HTTPException(status_code=404, detail="Till not found")

        return TillResponse(till=till)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update till: {str(e)}")


@router.delete("/tills/{till_id}")
def delete_till_endpoint(
    till_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete till"""
    try:
        success = logic.delete_till(till_id, db, str(tenant_context["tenant_id"]))
        if not success:
            raise HTTPException(status_code=404, detail="Till not found")

        return {"message": "Till deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete till: {str(e)}")


# ========================================
# Till Transaction Endpoints
# ========================================

@router.post("/till-transactions", response_model=TillTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_till_transaction_endpoint(
    transaction: TillTransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new till transaction"""
    try:
        transaction_data = transaction.dict()
        transaction_data["tenant_id"] = tenant_context["tenant_id"]
        transaction_data["performed_by"] = current_user.id
        transaction_data["id"] = str(uuid.uuid4())
        transaction_data["transaction_number"] = f"TILL-{uuid.uuid4().hex[:8].upper()}"
        transaction_data["transaction_date"] = datetime.utcnow()

        db_transaction = logic.create_till_transaction(transaction_data, db)
        return TillTransactionResponse(till_transaction=db_transaction)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create till transaction: {str(e)}")


@router.get("/till-transactions", response_model=TillTransactionsResponse)
def get_till_transactions_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    till_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all till transactions"""
    try:
        transactions = logic.get_all_till_transactions(db, str(tenant_context["tenant_id"]), till_id, skip, limit)
        return TillTransactionsResponse(till_transactions=transactions, total=len(transactions))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch till transactions: {str(e)}")


@router.get("/till-transactions/{transaction_id}", response_model=TillTransactionResponse)
def get_till_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get till transaction by ID"""
    try:
        transaction = logic.get_till_transaction_by_id(transaction_id, db, str(tenant_context["tenant_id"]))
        if not transaction:
            raise HTTPException(status_code=404, detail="Till transaction not found")

        return TillTransactionResponse(till_transaction=transaction)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch till transaction: {str(e)}")


@router.put("/till-transactions/{transaction_id}", response_model=TillTransactionResponse)
def update_till_transaction_endpoint(
    transaction_id: str,
    transaction_update: TillTransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update till transaction"""
    try:
        update_data = {k: v for k, v in transaction_update.dict().items() if v is not None}
        transaction = logic.update_till_transaction(transaction_id, update_data, db, str(tenant_context["tenant_id"]))

        if not transaction:
            raise HTTPException(status_code=404, detail="Till transaction not found")

        return TillTransactionResponse(till_transaction=transaction)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update till transaction: {str(e)}")


@router.delete("/till-transactions/{transaction_id}")
def delete_till_transaction_endpoint(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete till transaction"""
    try:
        success = logic.delete_till_transaction(transaction_id, db, str(tenant_context["tenant_id"]))
        if not success:
            raise HTTPException(status_code=404, detail="Till transaction not found")

        return {"message": "Till transaction deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete till transaction: {str(e)}")
