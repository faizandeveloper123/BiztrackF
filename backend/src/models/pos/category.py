import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base


class PosProductCategory(Base):
    __tablename__ = "pos_product_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    name = Column(String(255), nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_pos_product_categories_tenant_name", "tenant_id", "name", unique=True),
    )
