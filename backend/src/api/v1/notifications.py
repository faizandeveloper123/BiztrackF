from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...services.notification_service import NotificationService
from ...config.notification_models import NotificationType, NotificationCategory
from ...config.mobile_push_crud import upsert_push_device, delete_push_device

router = APIRouter()

# Pydantic models for API
class NotificationTypeEnum(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"
    SYSTEM = "system"

class NotificationCategoryEnum(str, Enum):
    HRM = "hrm"
    INVENTORY = "inventory"
    CRM = "crm"
    PRODUCTION = "production"
    QUALITY = "quality"
    MAINTENANCE = "maintenance"
    LEDGER = "ledger"
    PROJECTS = "projects"
    SYSTEM = "system"

class NotificationResponse(BaseModel):
    id: str
    tenant_id: str
    user_id: str
    title: str
    message: str
    type: str
    category: str
    is_read: bool
    read_at: Optional[str] = None
    action_url: Optional[str] = None
    notification_data: Optional[dict] = None
    created_at: str
    updated_at: str

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    pagination: dict

class NotificationPreferencesResponse(BaseModel):
    preferences: List[dict]

class NotificationPreferenceUpdate(BaseModel):
    category: NotificationCategoryEnum
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None


class MobilePushRegisterBody(BaseModel):
    expo_push_token: str
    platform: Optional[str] = None


class MobilePushUnregisterBody(BaseModel):
    expo_push_token: str

@router.post("/notifications/push/register")
async def register_mobile_push_token(
    body: MobilePushRegisterBody,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        upsert_push_device(
            db,
            str(current_user.id),
            body.expo_push_token,
            platform=body.platform,
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/notifications/push/register")
async def unregister_mobile_push_token(
    body: MobilePushUnregisterBody,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        n = delete_push_device(db, str(current_user.id), body.expo_push_token)
        return {"success": True, "removed": n}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/notifications", response_model=NotificationListResponse)
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    is_read: Optional[bool] = Query(None),
    category: Optional[NotificationCategoryEnum] = Query(None),
    type: Optional[NotificationTypeEnum] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get notifications for the current user"""
    try:
        service = NotificationService(db)
        
        # Convert enum values
        category_enum = None
        if category:
            category_enum = NotificationCategory(category.value)
        
        type_enum = None
        if type:
            type_enum = NotificationType(type.value)
        
        notifications = service.get_user_notifications(
            tenant_id=tenant_context["tenant_id"],
            user_id=str(current_user.id),
            page=page,
            limit=limit,
            is_read=is_read,
            category=category_enum,
            type=type_enum
        )
        
        return NotificationListResponse(
            notifications=notifications,
            pagination={
                "page": page,
                "limit": limit,
                "total": len(notifications),
                "pages": (len(notifications) + limit - 1) // limit
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@router.get("/notifications/unread-count")
async def get_unread_count(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get count of unread notifications"""
    try:
        service = NotificationService(db)
        count = service.get_unread_count(
            tenant_id=tenant_context["tenant_id"],
            user_id=str(current_user.id)
        )
        return {"unread_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching unread count: {str(e)}")

@router.put("/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Mark a notification as read"""
    try:
        service = NotificationService(db)
        success = service.mark_as_read(
            notification_id=notification_id,
            tenant_id=tenant_context["tenant_id"],
            user_id=str(current_user.id)
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking notification as read: {str(e)}")

@router.put("/notifications/{notification_id}/unread")
async def mark_notification_as_unread(
    notification_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Mark a notification as unread"""
    try:
        service = NotificationService(db)
        success = service.mark_as_unread(
            notification_id=notification_id,
            tenant_id=tenant_context["tenant_id"],
            user_id=str(current_user.id)
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Notification marked as unread"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking notification as unread: {str(e)}")

@router.post("/notifications/mark-all-read")
async def mark_all_notifications_as_read(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Mark all notifications as read for the current user"""
    try:
        service = NotificationService(db)
        count = service.mark_all_as_read(
            tenant_id=tenant_context["tenant_id"],
            user_id=str(current_user.id)
        )
        
        return {"message": f"Marked {count} notifications as read"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking all notifications as read: {str(e)}")

@router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a notification"""
    try:
        service = NotificationService(db)
        success = service.delete_notification(
            notification_id=notification_id,
            tenant_id=tenant_context["tenant_id"],
            user_id=str(current_user.id)
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        return {"message": "Notification deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")

@router.get("/notifications/preferences", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get notification preferences for the current user"""
    try:
        service = NotificationService(db)
        preferences = service.get_notification_preferences(
            tenant_id=tenant_context["tenant_id"],
            user_id=str(current_user.id)
        )
        
        return NotificationPreferencesResponse(preferences=preferences)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notification preferences: {str(e)}")

@router.put("/notifications/preferences")
async def update_notification_preference(
    preference: NotificationPreferenceUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update notification preferences for the current user"""
    try:
        service = NotificationService(db)
        success = service.update_notification_preference(
            tenant_id=tenant_context["tenant_id"],
            user_id=str(current_user.id),
            category=NotificationCategory(preference.category.value),
            email_enabled=preference.email_enabled,
            push_enabled=preference.push_enabled,
            in_app_enabled=preference.in_app_enabled
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Error updating notification preference")
        
        return {"message": "Notification preference updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating notification preference: {str(e)}")

@router.post("/notifications/cleanup")
async def cleanup_old_notifications(
    days_old: int = Query(30, ge=1, le=365),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Clean up old read notifications"""
    try:
        service = NotificationService(db)
        deleted_count = service.cleanup_old_notifications(
            tenant_id=tenant_context["tenant_id"],
            user_id=str(current_user.id),
            days_old=days_old
        )
        
        return {"message": f"Deleted {deleted_count} old notifications"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cleaning up notifications: {str(e)}")
