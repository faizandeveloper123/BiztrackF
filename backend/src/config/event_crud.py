from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
import uuid
from .event_models import Event, EventType, EventStatus, RecurrenceType

# Event CRUD functions
def get_event_by_id(event_id: str, db: Session, tenant_id: str = None) -> Optional[Event]:
    query = db.query(Event).filter(Event.id == event_id)
    if tenant_id:
        query = query.filter(Event.tenant_id == tenant_id)
    return query.first()

def get_all_events(
    db: Session,
    tenant_id: str = None,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
) -> List[Event]:
    query = db.query(Event)
    if tenant_id:
        query = query.filter(Event.tenant_id == tenant_id)
    if status:
        query = query.filter(Event.status == status)
    return query.order_by(Event.startDate.desc()).offset(skip).limit(limit).all()

def get_events_by_project(project_id: str, db: Session, tenant_id: str = None) -> List[Event]:
    query = db.query(Event).filter(Event.projectId == project_id)
    if tenant_id:
        query = query.filter(Event.tenant_id == tenant_id)
    return query.order_by(Event.startDate.desc()).all()

def get_events_by_user(user_id: str, db: Session, tenant_id: str = None) -> List[Event]:
    query = db.query(Event).filter(Event.createdById == user_id)
    if tenant_id:
        query = query.filter(Event.tenant_id == tenant_id)
    return query.order_by(Event.startDate.desc()).all()

def get_upcoming_events(db: Session, tenant_id: str = None, days: int = 7) -> List[Event]:
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=days)
    
    query = db.query(Event).filter(
        and_(
            Event.startDate >= start_date,
            Event.startDate <= end_date,
            Event.status == EventStatus.SCHEDULED
        )
    )
    if tenant_id:
        query = query.filter(Event.tenant_id == tenant_id)
    return query.order_by(Event.startDate.asc()).all()

def create_event(event_data: dict, db: Session) -> Event:
    db_event = Event(**event_data)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def update_event(event_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[Event]:
    event = get_event_by_id(event_id, db, tenant_id)
    if event:
        for key, value in update_data.items():
            if hasattr(event, key) and value is not None:
                setattr(event, key, value)
        event.updatedAt = datetime.utcnow()
        db.commit()
        db.refresh(event)
    return event

def delete_event(event_id: str, db: Session, tenant_id: str = None) -> bool:
    event = get_event_by_id(event_id, db, tenant_id)
    if event:
        db.delete(event)
        db.commit()
        return True
    return False

def get_events_by_status(status: EventStatus, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Event]:
    query = db.query(Event).filter(Event.status == status)
    if tenant_id:
        query = query.filter(Event.tenant_id == tenant_id)
    return query.order_by(Event.startDate.desc()).offset(skip).limit(limit).all()

def get_events_by_type(event_type: EventType, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Event]:
    query = db.query(Event).filter(Event.eventType == event_type)
    if tenant_id:
        query = query.filter(Event.tenant_id == tenant_id)
    return query.order_by(Event.startDate.desc()).offset(skip).limit(limit).all()

def search_events(search_term: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[Event]:
    query = db.query(Event).filter(
        or_(
            Event.title.ilike(f"%{search_term}%"),
            Event.description.ilike(f"%{search_term}%"),
            Event.location.ilike(f"%{search_term}%")
        )
    )
    if tenant_id:
        query = query.filter(Event.tenant_id == tenant_id)
    return query.order_by(Event.startDate.desc()).offset(skip).limit(limit).all()
