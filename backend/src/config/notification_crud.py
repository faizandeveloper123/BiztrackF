from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from .notification_models import Notification, NotificationPreference, NotificationType, NotificationCategory

def get_notification_by_id(notification_id: str, db: Session, tenant_id: str = None, user_id: str = None) -> Optional[Notification]:
    query = db.query(Notification).filter(Notification.id == notification_id)
    if tenant_id:
        query = query.filter(Notification.tenant_id == tenant_id)
    if user_id:
        query = query.filter(Notification.user_id == user_id)
    return query.first()

def get_user_notifications(
    db: Session, 
    tenant_id: str, 
    user_id: str, 
    skip: int = 0, 
    limit: int = 50,
    is_read: Optional[bool] = None,
    category: Optional[NotificationCategory] = None,
    type: Optional[NotificationType] = None
) -> List[Notification]:
    query = db.query(Notification).filter(
        Notification.tenant_id == tenant_id,
        Notification.user_id == user_id
    )
    
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    
    if category:
        query = query.filter(Notification.category == category)
    
    if type:
        query = query.filter(Notification.type == type)
    
    return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

def get_unread_count(db: Session, tenant_id: str, user_id: str) -> int:
    return db.query(Notification).filter(
        Notification.tenant_id == tenant_id,
        Notification.user_id == user_id,
        Notification.is_read == False
    ).count()

def create_notification(notification_data: Dict[str, Any], db: Session) -> Notification:
    db_notification = Notification(**notification_data)
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def mark_notification_as_read(notification_id: str, db: Session, tenant_id: str = None, user_id: str = None) -> Optional[Notification]:
    notification = get_notification_by_id(notification_id, db, tenant_id, user_id)
    if notification and not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.commit()
        db.refresh(notification)
    return notification

def mark_notification_as_unread(notification_id: str, db: Session, tenant_id: str = None, user_id: str = None) -> Optional[Notification]:
    notification = get_notification_by_id(notification_id, db, tenant_id, user_id)
    if notification and notification.is_read:
        notification.is_read = False
        notification.read_at = None
        db.commit()
        db.refresh(notification)
    return notification

def mark_all_notifications_as_read(db: Session, tenant_id: str, user_id: str) -> int:
    updated_count = db.query(Notification).filter(
        Notification.tenant_id == tenant_id,
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({
        'is_read': True,
        'read_at': datetime.utcnow()
    })
    db.commit()
    return updated_count

def delete_notification(notification_id: str, db: Session, tenant_id: str = None, user_id: str = None) -> bool:
    notification = get_notification_by_id(notification_id, db, tenant_id, user_id)
    if notification:
        db.delete(notification)
        db.commit()
        return True
    return False

def delete_old_notifications(db: Session, tenant_id: str, user_id: str, days_old: int = 30) -> int:
    cutoff_date = datetime.utcnow() - timedelta(days=days_old)
    deleted_count = db.query(Notification).filter(
        Notification.tenant_id == tenant_id,
        Notification.user_id == user_id,
        Notification.created_at < cutoff_date,
        Notification.is_read == True
    ).delete()
    db.commit()
    return deleted_count

# Notification Preferences CRUD
def get_user_notification_preferences(
    db: Session, 
    tenant_id: str, 
    user_id: str
) -> List[NotificationPreference]:
    return db.query(NotificationPreference).filter(
        NotificationPreference.tenant_id == tenant_id,
        NotificationPreference.user_id == user_id
    ).all()

def get_notification_preference(
    db: Session, 
    tenant_id: str, 
    user_id: str, 
    category: NotificationCategory
) -> Optional[NotificationPreference]:
    return db.query(NotificationPreference).filter(
        NotificationPreference.tenant_id == tenant_id,
        NotificationPreference.user_id == user_id,
        NotificationPreference.category == category
    ).first()

def create_or_update_notification_preference(
    preference_data: Dict[str, Any], 
    db: Session
) -> NotificationPreference:
    existing = get_notification_preference(
        db, 
        preference_data['tenant_id'], 
        preference_data['user_id'], 
        preference_data['category']
    )
    
    if existing:
        for key, value in preference_data.items():
            if hasattr(existing, key) and key not in ['id', 'tenant_id', 'user_id', 'category']:
                setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db_preference = NotificationPreference(**preference_data)
        db.add(db_preference)
        db.commit()
        db.refresh(db_preference)
        return db_preference

def is_notification_enabled(
    db: Session, 
    tenant_id: str, 
    user_id: str, 
    category: NotificationCategory, 
    notification_type: str = 'in_app'
) -> bool:
    preference = get_notification_preference(db, tenant_id, user_id, category)
    if not preference:
        return True  # Default to enabled if no preference set
    
    if notification_type == 'email':
        return preference.email_enabled
    elif notification_type == 'push':
        return preference.push_enabled
    elif notification_type == 'in_app':
        return preference.in_app_enabled
    
    return True
