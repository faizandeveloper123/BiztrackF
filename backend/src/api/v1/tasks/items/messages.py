from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4
import logging
import threading

from fastapi import HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from .....api.dependencies import can_see_all_tasks
from .....config.database import get_user_by_id
from .....config.notification_models import NotificationCategory, NotificationType
from .....models.projects import Task, TaskMessage
from .....services.notification_service import NotificationService, display_user_name

logger = logging.getLogger(__name__)


def _get_task(task_id: str, db: Session, tenant_id: Optional[str] = None) -> Optional[Task]:
    query = db.query(Task).filter(Task.id == task_id)
    if tenant_id:
        query = query.filter(Task.tenant_id == tenant_id)
    return query.first()


class TaskMessageCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)
    messageType: str = "message"


class TaskMessageResponse(BaseModel):
    id: str
    taskId: str
    authorId: str
    authorName: str
    body: str
    messageType: str
    createdAt: Optional[str] = None
    isMine: bool = False


def _user_can_access_task(task: Task, current_user, tenant_context: dict) -> bool:
    if can_see_all_tasks(tenant_context or {}):
        return True
    uid = str(current_user.id)
    if task.assignedToId and str(task.assignedToId) == uid:
        return True
    if str(task.createdById) == uid:
        return True
    return False


def _serialize_message(message: TaskMessage, current_user_id: str) -> TaskMessageResponse:
    author = message.author
    author_name = display_user_name(author, fallback="User") if author else "User"
    return TaskMessageResponse(
        id=str(message.id),
        taskId=str(message.taskId),
        authorId=str(message.authorId),
        authorName=author_name,
        body=message.body,
        messageType=message.messageType or "message",
        createdAt=message.createdAt.isoformat() if message.createdAt else None,
        isMine=str(message.authorId) == str(current_user_id),
    )


def _notify_message_recipient(
    db: Session,
    tenant_id: str,
    task: Task,
    sender,
    message_body: str,
    message_type: str,
) -> None:
    sender_id = str(sender.id)
    recipient_ids = set()
    if task.assignedToId and str(task.assignedToId) != sender_id:
        recipient_ids.add(str(task.assignedToId))
    if task.createdById and str(task.createdById) != sender_id:
        recipient_ids.add(str(task.createdById))

    if not recipient_ids:
        return

    sender_name = display_user_name(sender, fallback="A teammate")
    preview = message_body.strip().replace("\n", " ")
    if len(preview) > 160:
        preview = preview[:160] + "..."
    is_info_request = message_type == "info_request"
    title = (
        f"Info requested: {task.title[:50]}"
        if is_info_request
        else f"Task message: {task.title[:50]}"
    )
    message = (
        f"{sender_name} asked for more info on \"{task.title}\": {preview}"
        if is_info_request
        else f"{sender_name} on \"{task.title}\": {preview}"
    )
    action_url = f"/tasks?taskId={task.id}"
    category = NotificationCategory.PROJECTS
    service = NotificationService(db)

    for recipient_id in recipient_ids:
        service.create_notification(
            tenant_id=tenant_id,
            user_id=recipient_id,
            title=title,
            message=message,
            category=category,
            type=NotificationType.INFO,
            action_url=action_url,
            notification_data={
                "task_id": str(task.id),
                "project_id": str(task.projectId) if task.projectId else None,
                "message_type": message_type,
            },
        )
        recipient = get_user_by_id(recipient_id, db)
        if not recipient or not getattr(recipient, "email", None):
            continue
        from .....config.notification_crud import is_notification_enabled
        if not is_notification_enabled(db, tenant_id, recipient_id, category, "email"):
            continue
        email_payload = {
            "to_email": recipient.email,
            "recipient_name": display_user_name(recipient, fallback="there"),
            "sender_name": sender_name,
            "task_title": task.title,
            "message_body": message_body.strip(),
            "is_info_request": is_info_request,
            "action_url": action_url,
        }

        def _send_email(payload=email_payload) -> None:
            try:
                from .....services.email_service import EmailService
                EmailService().send_task_message_email(**payload)
            except Exception as e:
                logger.error("Failed to send task message email: %s", e, exc_info=True)

        threading.Thread(target=_send_email, daemon=True).start()


def list_task_messages(
    task_id: str,
    db: Session,
    current_user,
    tenant_context: dict,
) -> List[TaskMessageResponse]:
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    task = _get_task(task_id, db, tenant_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not _user_can_access_task(task, current_user, tenant_context):
        raise HTTPException(status_code=403, detail="Not authorized to view task messages")

    rows = (
        db.query(TaskMessage)
        .options(joinedload(TaskMessage.author))
        .filter(TaskMessage.taskId == task.id, TaskMessage.tenant_id == tenant_id)
        .order_by(TaskMessage.createdAt.asc())
        .all()
    )
    return [_serialize_message(row, str(current_user.id)) for row in rows]


def create_task_message(
    task_id: str,
    data: TaskMessageCreate,
    db: Session,
    current_user,
    tenant_context: dict,
) -> TaskMessageResponse:
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    tenant_id = tenant_context["tenant_id"]
    task = _get_task(task_id, db, tenant_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not _user_can_access_task(task, current_user, tenant_context):
        raise HTTPException(status_code=403, detail="Not authorized to message on this task")

    body = (data.body or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    message_type = (data.messageType or "message").strip().lower()
    if message_type not in {"message", "info_request"}:
        message_type = "message"

    row = TaskMessage(
        id=uuid4(),
        tenant_id=tenant_id if isinstance(tenant_id, UUID) else UUID(str(tenant_id)),
        taskId=task.id,
        authorId=current_user.id if isinstance(current_user.id, UUID) else UUID(str(current_user.id)),
        body=body,
        messageType=message_type,
        createdAt=datetime.utcnow(),
        updatedAt=datetime.utcnow(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    row = (
        db.query(TaskMessage)
        .options(joinedload(TaskMessage.author))
        .filter(TaskMessage.id == row.id)
        .first()
    ) or row

    try:
        _notify_message_recipient(db, str(tenant_id), task, current_user, body, message_type)
    except Exception as e:
        logger.error("Failed to notify task message recipients: %s", e, exc_info=True)

    return _serialize_message(row, str(current_user.id))
