import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Appointment(Base):
    __tablename__ = "healthcare_appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_doctors.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_patients.id", ondelete="SET NULL"), nullable=True)
    patient_name = Column(String(255), nullable=False)
    patient_phone = Column(String(50))
    appointment_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    status = Column(String(50), default="scheduled")
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_appointments_tenant_id", "tenant_id"),
        Index("ix_healthcare_appointments_doctor_date", "tenant_id", "doctor_id", "appointment_date"),
    )

    tenant = relationship("Tenant")
    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    prescriptions = relationship("Prescription", back_populates="appointment")
