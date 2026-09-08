import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from ..config.database_config import Base


class WhatsAppTemplate(Base):
    """Tenant-owned editable WhatsApp message template.

    These templates are managed inside BizTrack (no approval needed on the
    botlinkd/Meta dashboard). Bodies use ``{placeholder}`` variables which are
    filled at send time from live booking / job card data.
    """

    __tablename__ = "whatsapp_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    template_type = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("tenant_id", "template_type", name="uq_whatsapp_template_tenant_type"),
        Index("ix_whatsapp_templates_tenant_type", "tenant_id", "template_type"),
    )