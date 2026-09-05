import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, Text, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base


class Till(Base):
    __tablename__ = "tills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    initial_balance = Column(Float, default=0.0)
    current_balance = Column(Float, default=0.0)
    currency = Column(String, default="USD")

    is_active = Column(Boolean, default=True)
    description = Column(Text, nullable=True)

    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = relationship("TillTransaction", back_populates="till", cascade="all, delete-orphan")
    tenant = relationship("Tenant", back_populates="tills")
    created_by_user = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        Index("idx_tills_tenant", "tenant_id"),
        Index("idx_tills_active", "is_active"),
    )
