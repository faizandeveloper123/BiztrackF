from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from .common import Pagination

class EventType(str, Enum):
    MEETING = "meeting"
    WORKSHOP = "workshop"
    DEADLINE = "deadline"
    OTHER = "other"

class EventStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RecurrenceType(str, Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    eventType: EventType = EventType.MEETING
    startDate: datetime
    endDate: datetime
    timezone: str = "UTC"
    location: Optional[str] = None
    isOnline: bool = True
    googleMeetLink: Optional[str] = None
    googleCalendarEventId: Optional[str] = None
    recurrenceType: Optional[RecurrenceType] = None
    recurrenceData: Optional[Dict[str, Any]] = None
    reminderMinutes: int = 15
    participants: List[str] = []
    discussionPoints: List[str] = []
    attachments: List[str] = []
    projectId: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    eventType: Optional[EventType] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    timezone: Optional[str] = None
    location: Optional[str] = None
    isOnline: Optional[bool] = None
    googleMeetLink: Optional[str] = None
    googleCalendarEventId: Optional[str] = None
    recurrenceType: Optional[RecurrenceType] = None
    recurrenceData: Optional[Dict[str, Any]] = None
    reminderMinutes: Optional[int] = None
    participants: Optional[List[str]] = None
    discussionPoints: Optional[List[str]] = None
    attachments: Optional[List[str]] = None
    projectId: Optional[str] = None
    status: Optional[EventStatus] = None

class Event(EventBase):
    id: str
    status: EventStatus = EventStatus.SCHEDULED
    createdBy: str
    tenant_id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class EventResponse(BaseModel):
    events: List[Event]
    pagination: Optional[Pagination] = None

