from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context
from ...http_common import tenant_id_str
from .schemas import ExpenseCategory, ExpenseCategoryCreate, ExpenseCategoryUpdate, ExpenseCategoriesResponse
from . import logic

router = APIRouter()


@router.get("/expense-categories", response_model=ExpenseCategoriesResponse)
async def list_expense_categories(
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(500, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.list_expense_categories(
        tenant_id_str(tenant_context), db, search=search, is_active=is_active, page=page, limit=limit
    )


@router.get("/expense-categories/{category_id}", response_model=ExpenseCategory)
async def get_expense_category(
    category_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.get_expense_category(tenant_id_str(tenant_context), category_id, db)


@router.post("/expense-categories", response_model=ExpenseCategory, status_code=status.HTTP_201_CREATED)
async def create_expense_category_endpoint(
    body: ExpenseCategoryCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.create_expense_category_record(tenant_id_str(tenant_context), body, db)


@router.put("/expense-categories/{category_id}", response_model=ExpenseCategory)
async def update_expense_category_endpoint(
    category_id: str,
    body: ExpenseCategoryUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    return logic.update_expense_category_record(tenant_id_str(tenant_context), category_id, body, db)


@router.delete("/expense-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense_category_endpoint(
    category_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _= Depends(get_current_user),
):
    logic.delete_expense_category_record(tenant_id_str(tenant_context), category_id, db)
