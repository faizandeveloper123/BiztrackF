from typing import Any, Iterable, List, Optional, TypeVar

from .dependencies import can_see_all_tasks

T = TypeVar("T")


def can_see_all_crm_records(tenant_context: Optional[dict]) -> bool:
    return bool(tenant_context) and can_see_all_tasks(tenant_context)


def crm_record_visible(
    tenant_context: Optional[dict],
    current_user_id: str,
    assigned_to_id: Any,
    created_by_id: Any,
) -> bool:
    if not tenant_context:
        return False
    if can_see_all_crm_records(tenant_context):
        return True
    uid = str(current_user_id)
    if assigned_to_id is not None and str(assigned_to_id) == uid:
        return True
    if created_by_id is not None and str(created_by_id) == uid:
        return True
    return False


def filter_crm_rows(
    items: Iterable[T],
    tenant_context: Optional[dict],
    current_user_id: str,
) -> List[T]:
    if not tenant_context:
        return list(items)
    if can_see_all_crm_records(tenant_context):
        return list(items)
    out: List[T] = []
    for obj in items:
        a = getattr(obj, "assignedToId", None)
        c = getattr(obj, "createdById", None)
        if crm_record_visible(tenant_context, current_user_id, a, c):
            out.append(obj)
    return out
