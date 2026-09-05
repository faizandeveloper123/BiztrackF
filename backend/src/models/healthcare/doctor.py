import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Doctor(Base):
    __tablename__ = "healthcare_doctors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    pmdc_number = Column(String(50), nullable=False)
    phone = Column(String(50), nullable=False)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)
    email = Column(String(255))
    specialization = Column(String(255))
    qualification = Column(String(255))
    address = Column(Text)
    availability = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_doctors_tenant_pmdc", "tenant_id", "pmdc_number", unique=True),
        Index("ix_healthcare_doctors_tenant_id", "tenant_id"),
    )

    tenant = relationship("Tenant")
    appointments = relationship("Appointment", back_populates="doctor", passive_deletes=True)
    prescriptions = relationship("Prescription", back_populates="doctor", passive_deletes=True)
    admissions = relationship("Admission", back_populates="doctor", passive_deletes=True)
