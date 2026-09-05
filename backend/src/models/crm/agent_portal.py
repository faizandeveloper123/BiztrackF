import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Integer, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ...config.database_config import Base


class AgentSalesTarget(Base):
    __tablename__ = "agent_sales_targets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    targetAmount = Column(Float, nullable=False, default=0.0)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant")
    user = relationship("User", foreign_keys=[userId])

    __table_args__ = (
        Index("idx_agent_sales_targets_tenant_user", "tenant_id", "userId"),
    )


class AgentEarnedBadge(Base):
    __tablename__ = "agent_earned_badges"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    userId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    badgeKey = Column(String, nullable=False)
    earnedAt = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant")
    user = relationship("User", foreign_keys=[userId])

    __table_args__ = (
        Index("idx_agent_earned_badges_user", "tenant_id", "userId", "badgeKey", unique=True),
    )
