import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ...config.database_config import Base


class Donor(Base):
    __tablename__ = "ngo_donors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    donor_code = Column(String(32), nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    organization = Column(String(255))
    donor_type = Column(String(32), nullable=False, default="individual")
    status = Column(String(32), nullable=False, default="active")
    address = Column(Text)
    notes = Column(Text)
    total_donated = Column(Numeric(14, 2), nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("tenant_id", "donor_code", name="uq_ngo_donors_tenant_code"),
        UniqueConstraint("tenant_id", "email", name="uq_ngo_donors_tenant_email"),
        Index("ix_ngo_donors_tenant_id", "tenant_id"),
    )

    tenant = relationship("Tenant")
