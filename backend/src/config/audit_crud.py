from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from .audit_models import AuditLog, Permission, CustomRole

# AuditLog functions
def get_audit_log_by_id(audit_log_id: str, db: Session) -> Optional[AuditLog]:
    return db.query(AuditLog).filter(AuditLog.id == audit_log_id).first()

def get_all_audit_logs(db: Session, tenant_id: str = None, user_id: str = None, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    query = db.query(AuditLog)
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    if user_id:
        query = query.filter(AuditLog.userId == user_id)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_audit_logs_by_event_type(event_type: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    query = db.query(AuditLog).filter(AuditLog.eventType == event_type)
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_audit_logs_by_severity(severity: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    query = db.query(AuditLog).filter(AuditLog.severity == severity)
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_audit_logs_by_resource(resource_type: str, resource_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    query = db.query(AuditLog).filter(
        AuditLog.resourceType == resource_type,
        AuditLog.resourceId == resource_id
    )
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def create_audit_log(audit_log_data: dict, db: Session) -> AuditLog:
    db_audit_log = AuditLog(**audit_log_data)
    db.add(db_audit_log)
    db.commit()
    db.refresh(db_audit_log)
    return db_audit_log

def update_audit_log(audit_log_id: str, update_data: dict, db: Session) -> Optional[AuditLog]:
    audit_log = get_audit_log_by_id(audit_log_id, db)
    if audit_log:
        for key, value in update_data.items():
            if hasattr(audit_log, key) and value is not None:
                setattr(audit_log, key, value)
        db.commit()
        db.refresh(audit_log)
    return audit_log

def delete_audit_log(audit_log_id: str, db: Session) -> bool:
    audit_log = get_audit_log_by_id(audit_log_id, db)
    if audit_log:
        db.delete(audit_log)
        db.commit()
        return True
    return False

def get_audit_logs_by_date_range(start_date: datetime, end_date: datetime, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    query = db.query(AuditLog).filter(
        AuditLog.timestamp >= start_date,
        AuditLog.timestamp <= end_date
    )
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_audit_logs_by_action(action: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    query = db.query(AuditLog).filter(AuditLog.action == action)
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

def get_failed_audit_logs(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    query = db.query(AuditLog).filter(AuditLog.success == False)
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()

# Permission functions
def get_permission_by_code(permission_code: str, db: Session) -> Optional[Permission]:
    return db.query(Permission).filter(Permission.code == permission_code).first()

def get_all_permissions(db: Session, skip: int = 0, limit: int = 100) -> List[Permission]:
    return db.query(Permission).order_by(Permission.code).offset(skip).limit(limit).all()

def create_permission(permission_data: dict, db: Session) -> Permission:
    db_perm = Permission(**permission_data)
    db.add(db_perm)
    db.commit()
    db.refresh(db_perm)
    return db_perm

def update_permission(permission_code: str, update_data: dict, db: Session) -> Optional[Permission]:
    permission = get_permission_by_code(permission_code, db)
    if permission:
        for key, value in update_data.items():
            if hasattr(permission, key) and value is not None:
                setattr(permission, key, value)
        permission.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(permission)
    return permission

def delete_permission(permission_code: str, db: Session) -> bool:
    permission = get_permission_by_code(permission_code, db)
    if permission:
        db.delete(permission)
        db.commit()
        return True
    return False

def get_permissions_by_codes(permission_codes: List[str], db: Session) -> List[Permission]:
    return db.query(Permission).filter(Permission.code.in_(permission_codes)).all()

# Alias functions for backward compatibility
def get_permissions(db: Session, tenant_id: str = None) -> List[Permission]:
    """Get all permissions (alias for get_all_permissions)"""
    return get_all_permissions(db, tenant_id)

def create_permission(permission_data: dict, db: Session) -> Permission:
    """Create a new permission (alias for create_permission)"""
    return create_permission(permission_data, db)

def get_custom_roles(db: Session, tenant_id: str = None) -> List[CustomRole]:
    """Get all custom roles (alias for get_all_custom_roles)"""
    return get_all_custom_roles(db, tenant_id)

# CustomRole functions
def get_custom_role_by_id(role_id: str, db: Session, tenant_id: str = None) -> Optional[CustomRole]:
    query = db.query(CustomRole).filter(CustomRole.id == role_id)
    if tenant_id:
        query = query.filter(CustomRole.tenant_id == tenant_id)
    return query.first()

def get_custom_role_by_name(role_name: str, db: Session, tenant_id: str = None) -> Optional[CustomRole]:
    query = db.query(CustomRole).filter(CustomRole.name == role_name)
    if tenant_id:
        query = query.filter(CustomRole.tenant_id == tenant_id)
    return query.first()

def get_all_custom_roles(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomRole]:
    query = db.query(CustomRole)
    if tenant_id:
        query = query.filter(CustomRole.tenant_id == tenant_id)
    return query.order_by(CustomRole.createdAt.desc()).offset(skip).limit(limit).all()

def create_custom_role(role_data: dict, db: Session) -> CustomRole:
    db_role = CustomRole(**role_data)
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

def update_custom_role(role_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[CustomRole]:
    role = get_custom_role_by_id(role_id, db, tenant_id)
    if role:
        for key, value in update_data.items():
            if hasattr(role, key) and value is not None:
                setattr(role, key, value)
        role.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(role)
    return role

def delete_custom_role(role_id: str, db: Session, tenant_id: str = None) -> bool:
    role = get_custom_role_by_id(role_id, db, tenant_id)
    if role:
        db.delete(role)
        db.commit()
        return True
    return False

def get_custom_roles_by_permission(permission_code: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[CustomRole]:
    query = db.query(CustomRole).filter(CustomRole.permissions.contains([permission_code]))
    if tenant_id:
        query = query.filter(CustomRole.tenant_id == tenant_id)
    return query.order_by(CustomRole.createdAt.desc()).offset(skip).limit(limit).all()

# Audit statistics functions
def get_audit_statistics(db: Session, tenant_id: str = None, days: int = 30) -> Dict[str, Any]:
    from datetime import timedelta
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    query = db.query(AuditLog).filter(AuditLog.timestamp >= start_date, AuditLog.timestamp <= end_date)
    if tenant_id:
        query = query.filter(AuditLog.tenant_id == tenant_id)
    
    total_events = query.count()
    successful_events = query.filter(AuditLog.success == True).count()
    failed_events = query.filter(AuditLog.success == False).count()
    
    # Get event type distribution
    event_types = db.query(AuditLog.eventType, db.func.count(AuditLog.id)).filter(
        AuditLog.timestamp >= start_date,
        AuditLog.timestamp <= end_date
    )
    if tenant_id:
        event_types = event_types.filter(AuditLog.tenant_id == tenant_id)
    
    event_types = event_types.group_by(AuditLog.eventType).all()
    
    # Get severity distribution
    severities = db.query(AuditLog.severity, db.func.count(AuditLog.id)).filter(
        AuditLog.timestamp >= start_date,
        AuditLog.timestamp <= end_date
    )
    if tenant_id:
        severities = severities.filter(AuditLog.tenant_id == tenant_id)
    
    severities = severities.group_by(AuditLog.severity).all()
    
    return {
        "totalEvents": total_events,
        "successfulEvents": successful_events,
        "failedEvents": failed_events,
        "successRate": (successful_events / total_events * 100) if total_events > 0 else 0,
        "eventTypeDistribution": dict(event_types),
        "severityDistribution": dict(severities),
        "period": f"{days} days",
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat()
    }
