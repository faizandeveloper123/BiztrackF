import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    customerId = Column(String, nullable=False)  # Custom customer ID like CUST001
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    email = Column(String, nullable=True)
    emails = Column(JSON, default=list)
    phone = Column(String)
    mobile = Column(String)
    phones = Column(JSON, default=list)
    cnic = Column(String, unique=True, nullable=True)  # CNIC for Pakistani customers
    dateOfBirth = Column(DateTime)
    gender = Column(String)  # male, female, other
    address = Column(Text)
    city = Column(String)
    state = Column(String)
    country = Column(String, default="Pakistan")
    postalCode = Column(String)
    customerType = Column(String, default="individual")  # individual, business
    customerStatus = Column(String, default="active")  # active, inactive, blocked
    creditLimit = Column(Float, default=0.0)
    currentBalance = Column(Float, default=0.0)
    paymentTerms = Column(String, default="Cash")  # Credit, Card, Cash, Due Payments
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    createdById = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    notes = Column(Text)
    description = Column(Text, nullable=True)
    tags = Column(JSON, default=[])  # Store tags as JSON array
    attachments = Column(JSON, default=[])
    image_url = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customers")
    assignedTo = relationship("User", foreign_keys=[assignedToId])
    guarantors = relationship("CustomerGuarantor", back_populates="customer", cascade="all, delete-orphan")

    @property
    def createdBy(self):
        x = getattr(self, "createdById", None)
        return str(x) if x is not None else None
    
    # Indexes for search optimization
    __table_args__ = (
        Index('idx_customer_tenant_search', 'tenant_id', 'firstName', 'lastName'),
        Index('idx_customer_phone_search', 'tenant_id', 'phone'),
        Index('idx_customer_cnic_search', 'tenant_id', 'cnic'),
        Index('idx_customer_email_search', 'tenant_id', 'email'),
        Index('idx_customer_id_unique', 'tenant_id', 'customerId', unique=True),  # Unique customerId per tenant
    )

