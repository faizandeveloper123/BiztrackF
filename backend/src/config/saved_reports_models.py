import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base


class SavedReport(Base):
    __tablename__ = "saved_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    title = Column(String(500), nullable=False)
    file_type = Column(String(10), nullable=False)
    file_url = Column(Text, nullable=False)
    s3_key = Column(Text, nullable=False)
    original_filename = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant")
    created_by = relationship("User", foreign_keys=[created_by_id])

    __table_args__ = (Index("ix_saved_reports_tenant_created", "tenant_id", "createdAt"),)
