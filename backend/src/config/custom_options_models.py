import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class CustomEventType(Base):
    __tablename__ = "custom_event_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String, default="#007bff")
    isActive = Column(Boolean, default=True)
    createdByUserId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customEventTypes")
    createdByUser = relationship("User", back_populates="createdCustomEventTypes")

class CustomDepartment(Base):
    __tablename__ = "custom_departments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    managerId = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    isActive = Column(Boolean, default=True)
    createdByUserId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customDepartments")
    createdByUser = relationship("User", back_populates="createdCustomDepartments", foreign_keys=[createdByUserId])
    manager = relationship("User", foreign_keys=[managerId])

class CustomLeaveType(Base):
    __tablename__ = "custom_leave_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    defaultDays = Column(String, default="0")
    isPaid = Column(Boolean, default=False)
    isActive = Column(Boolean, default=True)
    createdByUserId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customLeaveTypes")
    createdByUser = relationship("User", back_populates="createdCustomLeaveTypes", foreign_keys=[createdByUserId])

class CustomLeadSource(Base):
    __tablename__ = "custom_lead_sources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    isActive = Column(Boolean, default=True)
    createdByUserId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customLeadSources")
    createdByUser = relationship("User", back_populates="createdCustomLeadSources", foreign_keys=[createdByUserId])

class CustomContactSource(Base):
    __tablename__ = "custom_contact_sources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    isActive = Column(Boolean, default=True)
    createdByUserId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customContactSources")
    createdByUser = relationship("User", back_populates="createdCustomContactSources", foreign_keys=[createdByUserId])

class CustomCompanyIndustry(Base):
    __tablename__ = "custom_company_industries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    isActive = Column(Boolean, default=True)
    createdByUserId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customCompanyIndustries")
    createdByUser = relationship("User", back_populates="createdCustomCompanyIndustries", foreign_keys=[createdByUserId])

class CustomContactType(Base):
    __tablename__ = "custom_contact_types"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    isActive = Column(Boolean, default=True)
    createdByUserId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customContactTypes")
    createdByUser = relationship("User", back_populates="createdCustomContactTypes", foreign_keys=[createdByUserId])

class CustomIndustry(Base):
    __tablename__ = "custom_industries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    isActive = Column(Boolean, default=True)
    createdByUserId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="customIndustries")
    createdByUser = relationship("User", back_populates="createdCustomIndustries", foreign_keys=[createdByUserId])
