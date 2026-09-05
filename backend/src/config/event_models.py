import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey, Index, Enum, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base
import enum

class EventType(str, enum.Enum):
    MEETING = "meeting"
    WORKSHOP = "workshop"
    DEADLINE = "deadline"
    OTHER = "other"

class EventStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class RecurrenceType(str, enum.Enum):
    NONE = "none"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

class Event(Base):
    __tablename__ = "events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    eventType = Column(Enum(EventType), nullable=False, default=EventType.MEETING)
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime, nullable=False)
    timezone = Column(String, default="UTC")
    location = Column(String)
    isOnline = Column(Boolean, default=True)
    googleMeetLink = Column(String)
    googleCalendarEventId = Column(String)
    recurrenceType = Column(Enum(RecurrenceType), default=RecurrenceType.NONE)
    recurrenceData = Column(JSON)
    reminderMinutes = Column(Integer, default=15)
    participants = Column(JSON, default=[])  # List of participant emails/IDs
    discussionPoints = Column(JSON, default=[])  # List of discussion points
    attachments = Column(JSON, default=[])  # List of attachment URLs
    projectId = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    status = Column(Enum(EventStatus), nullable=False, default=EventStatus.SCHEDULED)
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="events")
    project = relationship("Project", back_populates="events")
    createdBy = relationship("User", foreign_keys=[createdById], back_populates="created_events")
    
    # Indexes for performance optimization
    __table_args__ = (
        Index("idx_events_tenant_status", "tenant_id", "status"),
        Index("idx_events_start_date", "startDate"),
        Index("idx_events_project", "projectId"),
        Index("idx_events_created_by", "createdById"),
    )
