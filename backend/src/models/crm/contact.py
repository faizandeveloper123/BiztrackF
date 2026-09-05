import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base

class Contact(Base):
    __tablename__ = "contacts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String, nullable=True)
    emails = Column(JSON, default=list)
    phone = Column(String)
    mobile = Column(String)
    phones = Column(JSON, default=list)
    jobTitle = Column(String)
    department = Column(String)
    companyId = Column(UUID(as_uuid=True), ForeignKey("companies.id"))
    contactSource = Column(String)
    isActive = Column(Boolean, default=True)
    notes = Column(Text)
    description = Column(Text, nullable=True)
    attachments = Column(JSON, default=[])
    initials = Column(String, nullable=True)
    fullName = Column(String, nullable=True)
    birthday = Column(DateTime, nullable=True)
    businessTaxId = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    addresses = Column(JSON, default=list)
    socialLinks = Column(JSON, default=dict)
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    clientValue = Column(Float, nullable=True)
    lastContactDate = Column(DateTime, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="contacts")
    company = relationship("Company", back_populates="contacts")
    assignedTo = relationship("User", foreign_keys=[assignedToId])

    @property
    def contactType(self):
        return self.contactSource or "customer"

    @property
    def tags(self):
        return []

    @property
    def isPrimary(self):
        return False

    @property
    def createdBy(self):
        x = getattr(self, "createdById", None)
        return str(x) if x is not None else None
