import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base

class Opportunity(Base):
    __tablename__ = "opportunities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    companyId = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    contactId = Column(UUID(as_uuid=True), ForeignKey("contacts.id"))
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    stage = Column(String, nullable=False, default="prospecting")  # prospecting, qualification, proposal, negotiation, closed_won, closed_lost
    probability = Column(Integer, default=0)  # 0-100
    amount = Column(Float)
    expectedCloseDate = Column(DateTime)
    closedDate = Column(DateTime)
    wonAmount = Column(Float)
    lostReason = Column(Text)
    leadSource = Column(String)
    description = Column(Text)
    notes = Column(Text)
    tags = Column(JSON, default=[])
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="opportunities")
    company = relationship("Company", back_populates="opportunities")
    contact = relationship("Contact")
    assignedTo = relationship("User", foreign_keys=[assignedToId])

    @property
    def title(self):
        return self.name

    @title.setter
    def title(self, value):
        self.name = value

    @property
    def activities(self):
        return []

    @property
    def createdBy(self):
        x = getattr(self, "createdById", None)
        return str(x) if x is not None else None
