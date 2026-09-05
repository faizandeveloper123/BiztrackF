from datetime import datetime
from typing import Any, List, Optional, Type, TypeVar

from sqlalchemy.orm import Session

T = TypeVar("T")


def get_by_id(
    model: Type[T],
    entity_id: str,
    db: Session,
    tenant_id: Optional[str] = None,
) -> Optional[T]:
    q = db.query(model).filter(model.id == entity_id)
    if tenant_id is not None:
        q = q.filter(model.tenant_id == tenant_id)
    return q.first()


def list_for_tenant(
    model: Type[T],
    db: Session,
    tenant_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    *,
    order_by=None,
    filters: Optional[List[Any]] = None,
) -> List[T]:
    q = db.query(model)
    if tenant_id is not None:
        q = q.filter(model.tenant_id == tenant_id)
    for f in filters or []:
        q = q.filter(f)
    if order_by is not None:
        q = q.order_by(order_by)
    else:
        q = q.order_by(model.createdAt.desc())
    return q.offset(skip).limit(limit).all()


def create_entity(model: Type[T], data: dict, db: Session) -> T:
    entity = model(**data)
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


def update_entity(
    entity: T,
    update_data: dict,
    db: Session,
    *,
    nullable_keys: Optional[frozenset] = None,
) -> T:
    nullable = nullable_keys or frozenset()
    for key, value in update_data.items():
        if not hasattr(entity, key):
            continue
        if value is not None or key in nullable:
            setattr(entity, key, value)
    entity.updatedAt = datetime.utcnow()
    db.commit()
    db.refresh(entity)
    return entity


def delete_by_id(
    model: Type[T],
    entity_id: str,
    db: Session,
    tenant_id: Optional[str] = None,
) -> bool:
    entity = get_by_id(model, entity_id, db, tenant_id)
    if not entity:
        return False
    db.delete(entity)
    db.commit()
    return True


__all__ = [
    "get_by_id",
    "list_for_tenant",
    "create_entity",
    "update_entity",
    "delete_by_id",
]
