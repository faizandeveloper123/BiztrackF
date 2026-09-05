from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .schemas import POSTransactionCreate, POSTransactionUpdate, POSTransactionsResponse, POSTransactionResponse
from . import logic

router = APIRouter()


@router.get("/transactions", response_model=POSTransactionsResponse)
async def list_pos_transactions(
    status: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    amount_from: Optional[float] = Query(None),
    amount_to: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:transactions:view")),
):
    return logic.list_pos_transactions_endpoint(
        db,
        tenant_context,
        status,
        payment_method,
        date_from,
        date_to,
        amount_from,
        amount_to,
        search,
        page,
        limit,
    )


@router.get("/transactions/{transaction_id}", response_model=POSTransactionResponse)
async def get_pos_transaction(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:transactions:view")),
):
    return logic.get_pos_transaction_endpoint(db, tenant_context, transaction_id)


@router.post("/transactions", response_model=POSTransactionResponse)
async def create_pos_transaction(
    transaction_data: POSTransactionCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:transactions:create")),
):
    return logic.create_pos_transaction_endpoint(db, tenant_context, current_user, transaction_data)


@router.put("/transactions/{transaction_id}", response_model=POSTransactionResponse)
async def update_pos_transaction(
    transaction_id: str,
    transaction_data: POSTransactionUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission("pos:transactions:update")),
):
    return logic.update_pos_transaction_endpoint(db, tenant_context, transaction_id, transaction_data)
