import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ...config.database_config import Base


class DonorLead(Base):
    __tablename__ = "ngo_donor_leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    organization = Column(String(255))
    expected_donation = Column(Numeric(14, 2), nullable=False, default=0)
    status = Column(String(32), nullable=False, default="new")
    source = Column(String(32), nullable=False, default="other")
    assigned_to = Column(String(255))
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_ngo_donor_leads_tenant_id", "tenant_id"),
        Index("ix_ngo_donor_leads_tenant_status", "tenant_id", "status"),
    )

    tenant = relationship("Tenant")
