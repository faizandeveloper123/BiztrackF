from typing import List, Optional
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from .....models.healthcare import DailyExpense
from ...repository import create_entity, delete_by_id
from ..logic_common import paginated_list, create_payload, update_record
from ..shared import daily_expense_to_schema
from .schemas import DailyExpenseCreate, DailyExpenseUpdate, DailyExpensesResponse


def get_daily_expense_by_id(expense_id: str, db: Session, tenant_id: str = None):
    query = db.query(DailyExpense).options(joinedload(DailyExpense.category)).filter(DailyExpense.id == expense_id)
    if tenant_id:
        query = query.filter(DailyExpense.tenant_id == tenant_id)
    return query.first()


def get_daily_expenses(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[DailyExpense]:
    query = db.query(DailyExpense).filter(DailyExpense.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(DailyExpense.is_active == is_active)
    if category_id:
        query = query.filter(DailyExpense.category_id == category_id)
    if date_from is not None:
        query = query.filter(DailyExpense.expense_date >= date_from)
    if date_to is not None:
        query = query.filter(DailyExpense.expense_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            or_(DailyExpense.description.is_(None), DailyExpense.description.ilike(search_lower))
        )
    return (
        query.options(joinedload(DailyExpense.category))
        .order_by(DailyExpense.expense_date.desc(), DailyExpense.createdAt.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_daily_expenses_count(
    db: Session,
    tenant_id: str,
    category_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> int:
    query = db.query(DailyExpense).filter(DailyExpense.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(DailyExpense.is_active == is_active)
    if category_id:
        query = query.filter(DailyExpense.category_id == category_id)
    if date_from is not None:
        query = query.filter(DailyExpense.expense_date >= date_from)
    if date_to is not None:
        query = query.filter(DailyExpense.expense_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            or_(DailyExpense.description.is_(None), DailyExpense.description.ilike(search_lower))
        )
    return query.count()


def create_daily_expense(expense_data: dict, db: Session) -> DailyExpense:
    return create_entity(DailyExpense, expense_data, db)


def update_daily_expense(expense_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(expense_id, update_data, db, tenant_id, get_daily_expense_by_id)


def delete_daily_expense(expense_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(DailyExpense, expense_id, db, tenant_id)


def list_daily_expenses(
    tenant_id: str,
    db: Session,
    category_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 500,
) -> DailyExpensesResponse:
    return paginated_list(
        get_daily_expenses,
        get_daily_expenses_count,
        daily_expense_to_schema,
        DailyExpensesResponse,
        "expenses",
        db,
        tenant_id,
        page=page,
        limit=limit,
        get_kwargs={
            "category_id": category_id,
            "date_from": date_from,
            "date_to": date_to,
            "search": search,
            "is_active": is_active,
        },
    )


def get_daily_expense(tenant_id: str, expense_id: str, db: Session):
    db_expense = get_daily_expense_by_id(expense_id, db, tenant_id)
    if not db_expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily expense not found")
    return daily_expense_to_schema(db_expense)


def create_daily_expense_record(tenant_id: str, body: DailyExpenseCreate, db: Session):
    from ..expense_categories.logic import get_expense_category_by_id

    if not get_expense_category_by_id(body.category_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found")
    data = create_payload(body, tenant_id, is_active=True)
    db_expense = create_daily_expense(data, db)
    db_expense = get_daily_expense_by_id(str(db_expense.id), db, tenant_id)
    return daily_expense_to_schema(db_expense)


def update_daily_expense_record(tenant_id: str, expense_id: str, body: DailyExpenseUpdate, db: Session):
    from ..expense_categories.logic import get_expense_category_by_id

    if not get_daily_expense_by_id(expense_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily expense not found")
    if body.category_id is not None and not get_expense_category_by_id(body.category_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found")
    updated = update_daily_expense(expense_id, body.model_dump(exclude_unset=True), db, tenant_id)
    updated = get_daily_expense_by_id(str(updated.id), db, tenant_id)
    return daily_expense_to_schema(updated)


def delete_daily_expense_record(tenant_id: str, expense_id: str, db: Session) -> None:
    deleted = delete_daily_expense(expense_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Daily expense not found")
