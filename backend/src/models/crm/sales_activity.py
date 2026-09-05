import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base

class SalesActivity(Base):
    __tablename__ = "sales_activities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    type = Column(String, nullable=False)  # call, email, meeting, presentation, proposal
    subject = Column(String, nullable=False)
    description = Column(Text)
    relatedToType = Column(String)  # lead, contact, company, opportunity
    relatedToId = Column(UUID(as_uuid=True))
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    dueDate = Column(DateTime)
    completedAt = Column(DateTime)
    status = Column(String, default="pending")  # pending, in_progress, completed, cancelled
    priority = Column(String, default="medium")  # low, medium, high, urgent
    notes = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="sales_activities")
    assignedTo = relationship("User", foreign_keys=[assignedToId])

    @property
    def completed(self):
        return (getattr(self, "status", None) == "completed") or (
            getattr(self, "completedAt", None) is not None
        )

    @property
    def createdBy(self):
        x = getattr(self, "createdById", None)
        return str(x) if x is not None else None
