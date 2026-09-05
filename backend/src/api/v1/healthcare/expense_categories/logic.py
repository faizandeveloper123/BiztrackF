from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .....models.healthcare import ExpenseCategory
from ...repository import get_by_id, create_entity, delete_by_id
from ..logic_common import paginated_list, create_payload, update_record
from ..shared import expense_category_to_schema
from .schemas import ExpenseCategoryCreate, ExpenseCategoryUpdate, ExpenseCategoriesResponse, ExpenseCategory


def get_expense_category_by_id(category_id: str, db: Session, tenant_id: str = None):
    return get_by_id(ExpenseCategory, category_id, db, tenant_id)


def get_expense_categories(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[ExpenseCategory]:
    query = db.query(ExpenseCategory).filter(ExpenseCategory.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(ExpenseCategory.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            ExpenseCategory.name.ilike(search_lower)
            | or_(ExpenseCategory.description.is_(None), ExpenseCategory.description.ilike(search_lower))
        )
    return query.order_by(ExpenseCategory.name.asc()).offset(skip).limit(limit).all()


def get_expense_categories_count(
    db: Session,
    tenant_id: str,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> int:
    query = db.query(ExpenseCategory).filter(ExpenseCategory.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(ExpenseCategory.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            ExpenseCategory.name.ilike(search_lower)
            | or_(ExpenseCategory.description.is_(None), ExpenseCategory.description.ilike(search_lower))
        )
    return query.count()


def create_expense_category(category_data: dict, db: Session) -> ExpenseCategory:
    return create_entity(ExpenseCategory, category_data, db)


def update_expense_category(category_id: str, update_data: dict, db: Session, tenant_id: str = None):
    return update_record(category_id, update_data, db, tenant_id, get_expense_category_by_id)


def delete_expense_category(category_id: str, db: Session, tenant_id: str = None) -> bool:
    return delete_by_id(ExpenseCategory, category_id, db, tenant_id)


def list_expense_categories(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 500,
) -> ExpenseCategoriesResponse:
    return paginated_list(
        get_expense_categories,
        get_expense_categories_count,
        expense_category_to_schema,
        ExpenseCategoriesResponse,
        "categories",
        db,
        tenant_id,
        page=page,
        limit=limit,
        get_kwargs={"search": search, "is_active": is_active},
    )


def get_expense_category(tenant_id: str, category_id: str, db: Session) -> ExpenseCategory:
    db_category = get_expense_category_by_id(category_id, db, tenant_id)
    if not db_category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found")
    return expense_category_to_schema(db_category)


def create_expense_category_record(tenant_id: str, body: ExpenseCategoryCreate, db: Session):
    data = create_payload(body, tenant_id, is_active=True)
    db_category = create_expense_category(data, db)
    return expense_category_to_schema(db_category)


def update_expense_category_record(tenant_id: str, category_id: str, body: ExpenseCategoryUpdate, db: Session):
    if not get_expense_category_by_id(category_id, db, tenant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found")
    updated = update_expense_category(category_id, body.model_dump(exclude_unset=True), db, tenant_id)
    return expense_category_to_schema(updated)


def delete_expense_category_record(tenant_id: str, category_id: str, db: Session) -> None:
    from ..daily_expenses.logic import get_daily_expenses_count

    if get_daily_expenses_count(db, tenant_id, category_id=category_id) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category that has expenses. Remove or reassign expenses first.",
        )
    deleted = delete_expense_category(category_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense category not found")
