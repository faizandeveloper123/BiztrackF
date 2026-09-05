import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ...config.database_config import Base


class PartnerOrganization(Base):
    __tablename__ = "ngo_partner_organizations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    partner_code = Column(String(32), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    sector = Column(String(32), nullable=False, default="relief")
    organization_size = Column(String(32), nullable=False, default="medium")
    website = Column(String(512))
    location = Column(String(512))
    status = Column(String(32), nullable=False, default="active")
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("tenant_id", "partner_code", name="uq_ngo_partners_tenant_code"),
        UniqueConstraint("tenant_id", "email", name="uq_ngo_partners_tenant_email"),
        Index("ix_ngo_partner_organizations_tenant_id", "tenant_id"),
    )

    tenant = relationship("Tenant")
