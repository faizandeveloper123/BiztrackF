from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
import os
import threading
import uuid
from ..config.notification_crud import (
    create_notification, get_user_notifications, get_unread_count,
    mark_notification_as_read, mark_notification_as_unread, mark_all_notifications_as_read,
    delete_notification, delete_old_notifications, is_notification_enabled,
    create_or_update_notification_preference, get_user_notification_preferences
)
from ..config.notification_models import NotificationType, NotificationCategory
from ..config.database import get_tenant_users

logger = logging.getLogger(__name__)


def _build_notification_link(action_url: Optional[str]) -> Optional[str]:
    if not action_url:
        return None
    trimmed = action_url.strip()
    if trimmed.startswith("http://") or trimmed.startswith("https://"):
        return trimmed
    base = (os.getenv("FRONTEND_URL") or os.getenv("INVOICE_SHARE_BASE_URL") or "").rstrip("/")
    if not base:
        return trimmed
    path = trimmed if trimmed.startswith("/") else f"/{trimmed}"
    return f"{base}{path}"

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_notification(
        self,
        tenant_id: str,
        user_id: str,
        title: str,
        message: str,
        category: NotificationCategory,
        type: NotificationType = NotificationType.INFO,
        action_url: Optional[str] = None,
        notification_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Create a new notification for a user"""
        try:
            in_app_ok = is_notification_enabled(
                self.db, tenant_id, user_id, category, 'in_app'
            )
            push_ok = is_notification_enabled(
                self.db, tenant_id, user_id, category, 'push'
            )
            if not in_app_ok and not push_ok:
                return False

            extra = notification_data or {}

            if in_app_ok:
                row_payload = {
                    "id": str(uuid.uuid4()),
                    "tenant_id": tenant_id,
                    "user_id": user_id,
                    "title": title,
                    "message": message,
                    "type": type,
                    "category": category,
                    "action_url": action_url,
                    "notification_data": extra,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                create_notification(row_payload, self.db)

            if push_ok:
                try:
                    from .expo_push_service import send_expo_push_to_user
                    push_data = dict(extra) if extra else {}
                    if action_url:
                        push_data["action_url"] = action_url
                    send_expo_push_to_user(
                        self.db, user_id, title, message, data=push_data
                    )
                except Exception:
                    pass
            return True
        except Exception as e:
            print(f"Error creating notification: {str(e)}")
            return False
    
    def create_bulk_notifications(
        self,
        tenant_id: str,
        user_ids: List[str],
        title: str,
        message: str,
        category: NotificationCategory,
        type: NotificationType = NotificationType.INFO,
        action_url: Optional[str] = None,
        notification_data: Optional[Dict[str, Any]] = None
    ) -> int:
        """Create notifications for multiple users"""
        created_count = 0
        for user_id in user_ids:
            if self.create_notification(tenant_id, user_id, title, message, category, type, action_url, notification_data):
                created_count += 1
        return created_count
    
    def create_notification_for_all_tenant_users(
        self,
        tenant_id: str,
        title: str,
        message: str,
        category: NotificationCategory,
        type: NotificationType = NotificationType.INFO,
        action_url: Optional[str] = None,
        notification_data: Optional[Dict[str, Any]] = None
    ) -> int:
        """Create notifications for all active users in a tenant"""
        tenant_users = get_tenant_users(tenant_id, self.db, skip=0, limit=10000)
        user_ids = [str(tu.userId) for tu in tenant_users if tu.isActive]
        return self.create_bulk_notifications(
            tenant_id, user_ids, title, message, category, type, action_url, notification_data
        )
    
    def get_user_notifications(
        self,
        tenant_id: str,
        user_id: str,
        page: int = 1,
        limit: int = 50,
        is_read: Optional[bool] = None,
        category: Optional[NotificationCategory] = None,
        type: Optional[NotificationType] = None
    ) -> List[Dict[str, Any]]:
        """Get notifications for a user with pagination and filters"""
        skip = (page - 1) * limit
        notifications = get_user_notifications(
            self.db, tenant_id, user_id, skip, limit, is_read, category, type
        )
        
        return [
            {
                "id": str(notification.id),
                "tenant_id": str(notification.tenant_id),
                "user_id": str(notification.user_id),
                "title": notification.title,
                "message": notification.message,
                "type": notification.type.value,
                "category": notification.category.value,
                "is_read": notification.is_read,
                "read_at": notification.read_at.isoformat() if notification.read_at else None,
                "action_url": notification.action_url,
                "notification_data": notification.notification_data,
                "created_at": notification.created_at.isoformat(),
                "updated_at": notification.updated_at.isoformat()
            }
            for notification in notifications
        ]
    
    def get_unread_count(self, tenant_id: str, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        return get_unread_count(self.db, tenant_id, user_id)
    
    def mark_as_read(self, notification_id: str, tenant_id: str, user_id: str) -> bool:
        """Mark a notification as read"""
        notification = mark_notification_as_read(notification_id, self.db, tenant_id, user_id)
        return notification is not None
    
    def mark_as_unread(self, notification_id: str, tenant_id: str, user_id: str) -> bool:
        """Mark a notification as unread"""
        notification = mark_notification_as_unread(notification_id, self.db, tenant_id, user_id)
        return notification is not None
    
    def mark_all_as_read(self, tenant_id: str, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        return mark_all_notifications_as_read(self.db, tenant_id, user_id)
    
    def delete_notification(self, notification_id: str, tenant_id: str, user_id: str) -> bool:
        """Delete a notification"""
        return delete_notification(notification_id, self.db, tenant_id, user_id)
    
    def cleanup_old_notifications(self, tenant_id: str, user_id: str, days_old: int = 30) -> int:
        """Delete old read notifications"""
        return delete_old_notifications(self.db, tenant_id, user_id, days_old)
    
    def get_notification_preferences(self, tenant_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Get notification preferences for a user"""
        preferences = get_user_notification_preferences(self.db, tenant_id, user_id)
        return [
            {
                "id": str(pref.id),
                "tenant_id": str(pref.tenant_id),
                "user_id": str(pref.user_id),
                "category": pref.category.value,
                "email_enabled": pref.email_enabled,
                "push_enabled": pref.push_enabled,
                "in_app_enabled": pref.in_app_enabled,
                "created_at": pref.created_at.isoformat(),
                "updated_at": pref.updated_at.isoformat()
            }
            for pref in preferences
        ]
    
    def update_notification_preference(
        self,
        tenant_id: str,
        user_id: str,
        category: NotificationCategory,
        email_enabled: Optional[bool] = None,
        push_enabled: Optional[bool] = None,
        in_app_enabled: Optional[bool] = None
    ) -> bool:
        """Update notification preferences for a user"""
        try:
            preference_data = {
                "tenant_id": tenant_id,
                "user_id": user_id,
                "category": category,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            if email_enabled is not None:
                preference_data["email_enabled"] = email_enabled
            if push_enabled is not None:
                preference_data["push_enabled"] = push_enabled
            if in_app_enabled is not None:
                preference_data["in_app_enabled"] = in_app_enabled
            
            create_or_update_notification_preference(preference_data, self.db)
            return True
        except Exception as e:
            print(f"Error updating notification preference: {str(e)}")
            return False

# Helper functions for creating specific types of notifications
def create_hrm_notification(
    db: Session,
    tenant_id: str,
    user_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> bool:
    """Create an HRM-related notification"""
    service = NotificationService(db)
    return service.create_notification(
        tenant_id, user_id, title, message, NotificationCategory.HRM, type, action_url, notification_data
    )

def create_hrm_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create HRM-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.HRM, type, action_url, notification_data
    )

def create_inventory_notification(
    db: Session,
    tenant_id: str,
    user_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.WARNING,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> bool:
    """Create an inventory-related notification"""
    service = NotificationService(db)
    return service.create_notification(
        tenant_id, user_id, title, message, NotificationCategory.INVENTORY, type, action_url, notification_data
    )

def create_inventory_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.WARNING,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create inventory-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.INVENTORY, type, action_url, notification_data
    )

def create_system_notification(
    db: Session,
    tenant_id: str,
    user_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> bool:
    """Create a system-related notification"""
    service = NotificationService(db)
    return service.create_notification(
        tenant_id, user_id, title, message, NotificationCategory.SYSTEM, type, action_url, notification_data
    )

def create_system_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.SYSTEM,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create system-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.SYSTEM, type, action_url, notification_data
    )

def create_crm_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create CRM-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.CRM, type, action_url, notification_data
    )

def create_project_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create project-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.SYSTEM, type, action_url, notification_data
    )

def create_event_notification_for_all_tenant_users(
    db: Session,
    tenant_id: str,
    title: str,
    message: str,
    type: NotificationType = NotificationType.INFO,
    action_url: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None
) -> int:
    """Create event-related notification for all active users in a tenant"""
    service = NotificationService(db)
    return service.create_notification_for_all_tenant_users(
        tenant_id, title, message, NotificationCategory.SYSTEM, type, action_url, notification_data
    )


def notify_project_members(
    db: Session,
    tenant_id: str,
    project: Any,
    title: str,
    message: str,
    action_url: Optional[str] = None,
    exclude_user_id: Optional[str] = None,
    notification_data: Optional[Dict[str, Any]] = None,
    extra_user_ids: Optional[List[str]] = None,
) -> int:
    """Notify a project's team members, project manager, and task assignees."""
    from ..models.projects import Task

    user_ids = set()
    if getattr(project, "projectManagerId", None):
        user_ids.add(str(project.projectManagerId))
    for member in (getattr(project, "teamMembers", None) or []):
        user_ids.add(str(member.id))
    assignee_rows = db.query(Task.assignedToId).filter(
        Task.projectId == project.id,
        Task.assignedToId.isnot(None),
    ).distinct().all()
    for (assignee_id,) in assignee_rows:
        if assignee_id:
            user_ids.add(str(assignee_id))
    for uid in (extra_user_ids or []):
        if uid:
            user_ids.add(str(uid))
    if exclude_user_id:
        user_ids.discard(str(exclude_user_id))
    if not user_ids:
        return 0
    service = NotificationService(db)
    return service.create_bulk_notifications(
        tenant_id, list(user_ids), title, message,
        NotificationCategory.PROJECTS, NotificationType.INFO, action_url, notification_data
    )


def display_user_name(user: Any, fallback: str = "there") -> str:
    return (
        f"{(getattr(user, 'firstName') or '')} {(getattr(user, 'lastName') or '')}".strip()
        or getattr(user, 'userName', '')
        or fallback
    )


def send_assignment_notification(
    db: Session,
    tenant_id: str,
    assignee_user: Any,
    assigner_name: str,
    entity_type: str,
    entity_name: str,
    action_url: Optional[str] = None,
    category: NotificationCategory = NotificationCategory.PROJECTS,
    extra_details: Optional[dict] = None
) -> None:
    if not assignee_user:
        return
    assignee_id = str(assignee_user.id)
    assignee_name = display_user_name(assignee_user)
    title = f"Assigned: {entity_type} - {entity_name[:60]}{'...' if len(entity_name) > 60 else ''}"
    message = f"{assigner_name} assigned you to {entity_type}: {entity_name}"
    if getattr(assignee_user, 'email', None) and is_notification_enabled(db, tenant_id, assignee_id, category, 'email'):
        email_link = _build_notification_link(action_url)
        email_payload = {
            "to_email": assignee_user.email,
            "assignee_name": assignee_name,
            "assigner_name": assigner_name,
            "entity_type": entity_type,
            "entity_name": entity_name,
            "action_url": email_link,
            "extra_details": extra_details,
        }

        def _send_assignment_email() -> None:
            try:
                from .email_service import EmailService
                EmailService().send_assignment_email(**email_payload)
            except Exception as e:
                logger.error(
                    "Failed to send assignment email to %s: %s",
                    email_payload.get("to_email"),
                    e,
                    exc_info=True,
                )

        threading.Thread(target=_send_assignment_email, daemon=True).start()
    service = NotificationService(db)
    service.create_notification(
        tenant_id=tenant_id,
        user_id=assignee_id,
        title=title,
        message=message,
        category=category,
        type=NotificationType.INFO,
        action_url=action_url,
        notification_data={"entity_type": entity_type, "entity_name": entity_name},
    )


def send_assigner_confirmation_notification(
    db: Session,
    tenant_id: str,
    assigner_user: Any,
    receiver_names: str,
    entity_type: str,
    entity_name: str,
    action_url: Optional[str] = None,
    category: NotificationCategory = NotificationCategory.PROJECTS,
    extra_details: Optional[dict] = None,
) -> None:
    if not assigner_user:
        return
    assigner_id = str(assigner_user.id)
    assigner_name = display_user_name(assigner_user, fallback="there")
    receivers_label = (receiver_names or "").strip() or "the assigned recipient(s)"
    title = f"Assignment confirmed: {entity_type} - {entity_name[:50]}{'...' if len(entity_name) > 50 else ''}"
    message = f"You assigned {entity_type}: {entity_name} to {receivers_label}"
    if getattr(assigner_user, 'email', None) and is_notification_enabled(db, tenant_id, assigner_id, category, 'email'):
        email_link = _build_notification_link(action_url)
        email_payload = {
            "to_email": assigner_user.email,
            "assigner_name": assigner_name,
            "receiver_names": receivers_label,
            "entity_type": entity_type,
            "entity_name": entity_name,
            "action_url": email_link,
            "extra_details": extra_details,
        }

        def _send_assigner_email() -> None:
            try:
                from .email_service import EmailService
                EmailService().send_assigner_confirmation_email(**email_payload)
            except Exception as e:
                logger.error(
                    "Failed to send assigner confirmation email to %s: %s",
                    email_payload.get("to_email"),
                    e,
                    exc_info=True,
                )

        threading.Thread(target=_send_assigner_email, daemon=True).start()
    service = NotificationService(db)
    service.create_notification(
        tenant_id=tenant_id,
        user_id=assigner_id,
        title=title,
        message=message,
        category=category,
        type=NotificationType.INFO,
        action_url=action_url,
        notification_data={
            "entity_type": entity_type,
            "entity_name": entity_name,
            "receivers": receivers_label,
            "role": "assigner",
        },
    )


def notify_assignment_parties(
    db: Session,
    tenant_id: str,
    assigner_user: Any,
    receiver_users: List[Any],
    entity_type: str,
    entity_name: str,
    action_url: Optional[str] = None,
    category: NotificationCategory = NotificationCategory.PROJECTS,
    extra_details: Optional[dict] = None,
    receiver_entity_type: Optional[str] = None,
) -> None:
    assigner_name = display_user_name(assigner_user, fallback="A user")
    assigner_id = str(assigner_user.id) if assigner_user else None
    unique_receivers = []
    seen_ids = set()
    for receiver in receiver_users or []:
        if not receiver:
            continue
        receiver_id = str(receiver.id)
        if receiver_id in seen_ids:
            continue
        seen_ids.add(receiver_id)
        unique_receivers.append(receiver)

    for receiver in unique_receivers:
        send_assignment_notification(
            db,
            tenant_id,
            receiver,
            assigner_name,
            receiver_entity_type or entity_type,
            entity_name,
            action_url=action_url,
            category=category,
            extra_details=extra_details,
        )

    if not assigner_user or not unique_receivers:
        return

    receiver_names = ", ".join(display_user_name(user, fallback="User") for user in unique_receivers)
    only_self_assigned = len(unique_receivers) == 1 and str(unique_receivers[0].id) == assigner_id
    if only_self_assigned:
        return

    send_assigner_confirmation_notification(
        db,
        tenant_id,
        assigner_user,
        receiver_names,
        entity_type,
        entity_name,
        action_url=action_url,
        category=category,
        extra_details=extra_details,
    )
