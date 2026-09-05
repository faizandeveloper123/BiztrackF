import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database_config import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    make = Column(String, nullable=True)
    model = Column(String, nullable=True)
    year = Column(String, nullable=True)
    color = Column(String, nullable=True)
    vin = Column(String, nullable=True)
    registration_number = Column(String, nullable=True)
    mileage = Column(String, nullable=True)
    engine_number = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant")

    __table_args__ = (
        Index("idx_vehicles_tenant_id", "tenant_id"),
        Index("idx_vehicles_registration", "tenant_id", "registration_number"),
        Index("idx_vehicles_vin", "tenant_id", "vin"),
    )
