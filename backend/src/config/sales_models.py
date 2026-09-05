import uuid
from sqlalchemy import Column, String, DateTime, Float, Text, Boolean, ForeignKey, Integer, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class Quote(Base):
    __tablename__ = "quotes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    quoteNumber = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    opportunityId = Column(String, nullable=True)
    validUntil = Column(DateTime, nullable=False)
    terms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="draft")  # draft, sent, viewed, accepted, rejected, expired
    subtotal = Column(Float, default=0.0)
    taxRate = Column(Float, default=0.0)
    taxAmount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    sentAt = Column(DateTime, nullable=True)
    viewedAt = Column(DateTime, nullable=True)
    acceptedAt = Column(DateTime, nullable=True)
    createdBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="quotes")
    creator = relationship("User", back_populates="created_quotes")

class Contract(Base):
    __tablename__ = "contracts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    contractNumber = Column(String, unique=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    opportunityId = Column(String, nullable=True)
    contactId = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    companyId = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=True)
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime, nullable=False)
    value = Column(Float, nullable=False)
    terms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="draft")  # draft, pending_signature, signed, active, expired, terminated
    autoRenew = Column(Boolean, default=False)
    renewalTerms = Column(Text, nullable=True)
    signedAt = Column(DateTime, nullable=True)
    activatedAt = Column(DateTime, nullable=True)
    createdBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="contracts")
    creator = relationship("User", back_populates="created_contracts")
