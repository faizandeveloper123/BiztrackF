from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import func
from sqlalchemy.orm import Session
from .core_models import User, Tenant, Plan, Subscription

def get_user_by_email(email: str, db: Session) -> Optional[User]:
    if not email:
        return None
    normalized = email.strip().lower()
    return (
        db.query(User)
        .filter(func.lower(User.email) == normalized)
        .first()
    )

def get_user_by_username(username: str, db: Session) -> Optional[User]:
    return db.query(User).filter(User.userName == username).first()

def get_user_by_id(user_id: str, db: Session) -> Optional[User]:
    try:
        from uuid import UUID
        UUID(user_id)
        return db.query(User).filter(User.id == user_id).first()
    except (ValueError, TypeError):
        return None

def get_all_users(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[User]:
    query = db.query(User)
    if tenant_id:
        query = query.filter(User.tenant_id == tenant_id)
    return query.offset(skip).limit(limit).all()

def create_user(user_data: dict, db: Session) -> User:
    data = dict(user_data)
    if data.get("email"):
        data["email"] = str(data["email"]).strip().lower()
        if get_user_by_email(data["email"], db):
            raise ValueError("Email already registered")
    db_user = User(**data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(user_id: str, update_data: dict, db: Session) -> Optional[User]:
    user = get_user_by_id(user_id, db)
    if user:
        data = dict(update_data)
        if data.get("email"):
            data["email"] = str(data["email"]).strip().lower()
            existing = get_user_by_email(data["email"], db)
            if existing and str(existing.id) != str(user_id):
                raise ValueError("Email already registered")
        for key, value in data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        user.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(user)
    return user

def delete_user(user_id: str, db: Session) -> bool:
    user = get_user_by_id(user_id, db)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

# Tenant functions
def get_tenant_by_id(tenant_id: str, db: Session) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.id == tenant_id).first()

def get_tenant_by_domain(domain: str, db: Session) -> Optional[Tenant]:
    return db.query(Tenant).filter(Tenant.domain == domain).first()

def get_all_tenants(db: Session, skip: int = 0, limit: int = 100) -> List[Tenant]:
    return db.query(Tenant).offset(skip).limit(limit).all()

def create_tenant(tenant_data: dict, db: Session) -> Tenant:
    db_tenant = Tenant(**tenant_data)
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def update_tenant(tenant_id: str, update_data: dict, db: Session) -> Optional[Tenant]:
    tenant = get_tenant_by_id(tenant_id, db)
    if tenant:
        for key, value in update_data.items():
            if hasattr(tenant, key) and value is not None:
                setattr(tenant, key, value)
        tenant.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(tenant)
    return tenant

def delete_tenant(tenant_id: str, db: Session) -> bool:
    tenant = get_tenant_by_id(tenant_id, db)
    if tenant:
        db.delete(tenant)
        db.commit()
        return True
    return False

# Plan functions
def get_plan_by_id(plan_id: str, db: Session) -> Optional[Plan]:
    return db.query(Plan).filter(Plan.id == plan_id).first()

def get_plans(db: Session, skip: int = 0, limit: int = 100) -> List[Plan]:
    """Get all available plans"""
    return db.query(Plan).filter(Plan.isActive == True).offset(skip).limit(limit).all()

def get_all_plans(db: Session, skip: int = 0, limit: int = 100) -> List[Plan]:
    return db.query(Plan).filter(Plan.isActive == True).offset(skip).limit(limit).all()

def create_plan(plan_data: dict, db: Session) -> Plan:
    db_plan = Plan(**plan_data)
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

def update_plan(plan_id: str, update_data: dict, db: Session) -> Optional[Plan]:
    plan = get_plan_by_id(plan_id, db)
    if plan:
        for key, value in update_data.items():
            if hasattr(plan, key) and value is not None:
                setattr(plan, key, value)
        plan.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(plan)
    return plan

def delete_plan(plan_id: str, db: Session) -> bool:
    plan = get_plan_by_id(plan_id, db)
    if plan:
        db.delete(plan)
        db.commit()
        return True
    return False

# Subscription functions
def get_subscription_by_id(subscription_id: str, db: Session) -> Optional[Subscription]:
    return db.query(Subscription).filter(Subscription.id == subscription_id).first()

def get_tenant_subscription(tenant_id: str, db: Session) -> Optional[Subscription]:
    return db.query(Subscription).filter(
        Subscription.tenant_id == tenant_id,
        Subscription.status.in_(["active", "trial"])
    ).first()

def get_subscription_by_tenant(tenant_id: str, db: Session) -> Optional[Subscription]:
    """Get subscription for a specific tenant (alias for get_tenant_subscription)"""
    return get_tenant_subscription(tenant_id, db)

def get_all_subscriptions(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Subscription]:
    query = db.query(Subscription)
    if tenant_id:
        query = query.filter(Subscription.tenant_id == tenant_id)
    return query.offset(skip).limit(limit).all()

def create_subscription(subscription_data: dict, db: Session) -> Subscription:
    db_subscription = Subscription(**subscription_data)
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    return db_subscription

def update_subscription(subscription_id: str, update_data: dict, db: Session) -> Optional[Subscription]:
    subscription = get_subscription_by_id(subscription_id, db)
    if subscription:
        for key, value in update_data.items():
            if hasattr(subscription, key) and value is not None:
                setattr(subscription, key, value)
        subscription.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(subscription)
    return subscription

def delete_subscription(subscription_id: str, db: Session) -> bool:
    subscription = get_subscription_by_id(subscription_id, db)
    if subscription:
        db.delete(subscription)
        db.commit()
        return True
    return False

