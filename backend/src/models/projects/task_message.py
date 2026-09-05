import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base


class TaskMessage(Base):
    __tablename__ = "task_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False, index=True)
    taskId = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False, index=True)
    authorId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    messageType = Column(String, nullable=False, default="message")
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    task = relationship("Task", back_populates="messages")
    author = relationship("User", foreign_keys=[authorId])
