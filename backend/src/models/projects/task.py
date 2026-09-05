import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, Integer, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base
from .enums import TaskStatus, TaskPriority


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    priority = Column(Enum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
    projectId = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    parentTaskId = Column(UUID(as_uuid=True), ForeignKey("tasks.id"))
    dueDate = Column(String)
    estimatedHours = Column(Float)
    estimatedDurationSeconds = Column(Integer)
    reminderThresholdSeconds = Column(Integer)
    timeReminderSentAt = Column(DateTime)
    actualHours = Column(Float, default=0.0)
    tags = Column(Text)
    completedAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")
    assignedTo = relationship("User", foreign_keys=[assignedToId], back_populates="assigned_tasks")
    createdBy = relationship("User", foreign_keys=[createdById], back_populates="created_tasks")
    parent_task = relationship("Task", remote_side=[id], back_populates="subtasks")
    subtasks = relationship("Task", back_populates="parent_task")
    messages = relationship("TaskMessage", back_populates="task", cascade="all, delete-orphan")
