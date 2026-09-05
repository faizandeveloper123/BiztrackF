from typing import Any, Callable, Optional, Type, TypeVar

from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..repository import create_entity, delete_by_id, get_by_id, update_entity
from ..http_common import skip_limit


def update_record(entity_id, update_data, db, tenant_id, get_fn):
    entity = get_fn(entity_id, db, tenant_id)
    if not entity:
        return None
    return update_entity(entity, update_data, db)

T = TypeVar("T")
R = TypeVar("R", bound=BaseModel)


def paginated_list(
    get_rows: Callable[..., list],
    get_count: Callable[..., int],
    map_row: Callable[[Any], Any],
    response_cls: Type[R],
    list_field: str,
    db: Session,
    tenant_id: str,
    *,
    page: int = 1,
    limit: int = 20,
    get_kwargs: Optional[dict] = None,
) -> R:
    skip, lim = skip_limit(page, limit)
    kwargs = {"db": db, "tenant_id": tenant_id, "skip": skip, "limit": lim, **(get_kwargs or {})}
    rows = get_rows(**kwargs)
    count_kwargs = {k: v for k, v in kwargs.items() if k not in ("skip", "limit")}
    total = get_count(**count_kwargs)
    items = [map_row(r) for r in rows]
    return response_cls(**{list_field: items, "total": total})


def create_payload(body: BaseModel, tenant_id: str, **extra) -> dict:
    data = body.model_dump()
    data["tenant_id"] = tenant_id
    data.update(extra)
    return data
