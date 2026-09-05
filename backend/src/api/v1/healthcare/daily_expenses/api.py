from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date as date_type

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context
from ...http_common import tenant_id_str
from .schemas import DailyExpense, DailyExpenseCreate, DailyExpenseUpdate, DailyExpensesResponse
from . import logic

router = APIRouter()


@router.get("/daily-expenses", response_model=DailyExpensesResponse)
async def list_daily_expenses(
    category_id: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(500, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    date_from_parsed = date_type.fromisoformat(date_from) if date_from else None
    date_to_parsed = date_type.fromisoformat(date_to) if date_to else None
    return logic.list_daily_expenses(
        tenant_id_str(tenant_context),
        db,
        category_id=category_id,
        date_from=date_from_parsed,
        date_to=date_to_parsed,
        search=search,
        is_active=is_active,
        page=page,
        limit=limit,
    )


@router.get("/daily-expenses/{expense_id}", response_model=DailyExpense)
async def get_daily_expense(
    expense_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.get_daily_expense(tenant_id_str(tenant_context), expense_id, db)


@router.post("/daily-expenses", response_model=DailyExpense, status_code=status.HTTP_201_CREATED)
async def create_daily_expense_endpoint(
    body: DailyExpenseCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.create_daily_expense_record(tenant_id_str(tenant_context), body, db)


@router.put("/daily-expenses/{expense_id}", response_model=DailyExpense)
async def update_daily_expense_endpoint(
    expense_id: str,
    body: DailyExpenseUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.update_daily_expense_record(tenant_id_str(tenant_context), expense_id, body, db)


@router.delete("/daily-expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_daily_expense_endpoint(
    expense_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    logic.delete_daily_expense_record(tenant_id_str(tenant_context), expense_id, db)
