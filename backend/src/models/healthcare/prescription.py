import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Date, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Prescription(Base):
    __tablename__ = "healthcare_prescriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_appointments.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_doctors.id", ondelete="CASCADE"), nullable=False)
    patient_name = Column(String(255), nullable=False)
    patient_phone = Column(String(50))
    prescription_date = Column(Date, nullable=False)
    notes = Column(Text)
    items = Column(JSON, default=list)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_prescriptions_tenant_id", "tenant_id"),
        Index("ix_healthcare_prescriptions_appointment_id", "appointment_id"),
    )

    tenant = relationship("Tenant")
    appointment = relationship("Appointment", back_populates="prescriptions")
    doctor = relationship("Doctor", back_populates="prescriptions")
