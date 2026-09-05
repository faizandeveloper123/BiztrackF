import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Admission(Base):
    __tablename__ = "healthcare_admissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_doctors.id", ondelete="CASCADE"), nullable=False)
    admit_date = Column(Date, nullable=False)
    discharge_date = Column(Date, nullable=True)
    status = Column(String(50), default="admitted")
    ward = Column(String(255), nullable=False)
    room_or_bed = Column(String(100), nullable=True)
    diagnosis = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_admissions_tenant_id", "tenant_id"),
        Index("ix_healthcare_admissions_tenant_status", "tenant_id", "status"),
        Index("ix_healthcare_admissions_tenant_admit_date", "tenant_id", "admit_date"),
        Index("ix_healthcare_admissions_patient_id", "patient_id"),
        Index("ix_healthcare_admissions_doctor_id", "doctor_id"),
    )

    tenant = relationship("Tenant")
    patient = relationship("Patient", back_populates="admissions")
    doctor = relationship("Doctor", back_populates="admissions")
