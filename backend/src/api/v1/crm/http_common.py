import logging
import uuid
from typing import Any, Callable, List, Optional, TypeVar

from fastapi import HTTPException
from sqlalchemy.orm import Session

from ....api.crm_access import crm_record_visible, filter_crm_rows
from ..http_common import require_tenant, tenant_id_str

logger = logging.getLogger(__name__)
T = TypeVar("T")


def tenant_id_optional(tenant_context: Optional[dict]) -> Optional[str]:
    if not tenant_context:
        return None
    return str(tenant_context["tenant_id"])


def user_display_name(current_user) -> str:
    if hasattr(current_user, "firstName"):
        name = f"{current_user.firstName} {current_user.lastName}".strip()
        if name:
            return name
    if hasattr(current_user, "userName") and current_user.userName:
        return str(current_user.userName)
    return "A user"


def is_visible(tenant_context: Optional[dict], current_user, record) -> bool:
    return crm_record_visible(
        tenant_context,
        str(current_user.id),
        getattr(record, "assignedToId", None),
        getattr(record, "createdById", None),
    )


def visible_or_404(
    record,
    tenant_context: Optional[dict],
    current_user,
    *,
    detail: str = "Not found",
):
    if not record or not is_visible(tenant_context, current_user, record):
        raise HTTPException(status_code=404, detail=detail)
    return record


def pagination(page: int, limit: int, total: int) -> dict:
    pages = (total + limit - 1) // limit if limit else 1
    return {"page": page, "limit": limit, "total": total, "pages": max(1, pages)}


def apply_scoped_filters(
    items: List[T],
    tenant_context: Optional[dict],
    current_user,
    predicate: Optional[Callable[[T], bool]] = None,
) -> List[T]:
    if predicate:
        items = [i for i in items if predicate(i)]
    return filter_crm_rows(items, tenant_context, str(current_user.id))


def notify_crm_broadcast(
    db: Session,
    tenant_context: dict,
    current_user,
    *,
    title: str,
    message: str,
    path: str,
    meta: dict,
):
    try:
        from ....services.notification_service import create_crm_notification_for_all_tenant_users
        from ....config.notification_models import NotificationType

        create_crm_notification_for_all_tenant_users(
            db,
            tenant_id_str(tenant_context),
            title,
            message,
            NotificationType.INFO,
            path,
            meta,
        )
    except Exception as err:
        logger.error("Failed to create CRM notification: %s", err, exc_info=True)


def notify_assignee(
    db: Session,
    tenant_context: dict,
    current_user,
    record,
    *,
    entity_label: str,
    entity_name: str,
    path: str,
):
    assignee_id = getattr(record, "assignedToId", None)
    if not assignee_id:
        return
    try:
        from ....config.database import get_user_by_id
        from ....services.notification_service import send_assignment_notification
        from ....config.notification_models import NotificationCategory

        assignee = get_user_by_id(str(assignee_id), db)
        if assignee:
            send_assignment_notification(
                db,
                tenant_id_str(tenant_context),
                assignee,
                user_display_name(current_user),
                entity_label,
                entity_name,
                action_url=path,
                category=NotificationCategory.CRM,
            )
    except Exception as err:
        logger.error("Failed to send assignment notification: %s", err, exc_info=True)


def delete_message(entity: str) -> dict:
    return {"message": f"{entity} deleted successfully"}


def safe_uuid(value) -> Optional[uuid.UUID]:
    if value is None:
        return None
    try:
        s = str(value).strip()
        return uuid.UUID(s) if s else None
    except (ValueError, TypeError):
        return None
