import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    eventId = Column(String, nullable=False, index=True)
    eventType = Column(String, nullable=False, index=True)
    severity = Column(String, nullable=False, default="medium")
    userId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=True)
    resourceType = Column(String, nullable=True)
    resourceId = Column(String, nullable=True)
    action = Column(String, nullable=True)
    details = Column(JSON, default={})
    ipAddress = Column(String, nullable=True)
    userAgent = Column(String, nullable=True)
    success = Column(Boolean, default=True)
    errorMessage = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[userId])
    tenant = relationship("Tenant", foreign_keys=[tenant_id])

class Permission(Base):
    __tablename__ = "permissions"
    code = Column(String, primary_key=True, index=True)  # e.g. 'manage_projects'
    label = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CustomRole(Base):
    __tablename__ = "custom_roles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    permissions = Column(JSON, default=[])
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant")
