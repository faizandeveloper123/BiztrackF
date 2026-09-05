import uuid
from datetime import datetime

from sqlalchemy import Column, Float, DateTime, ForeignKey, Index, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base


class CashPosition(Base):
    __tablename__ = "cash_positions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    position_date = Column(DateTime, nullable=False, index=True)

    total_bank_balance = Column(Float, default=0.0)
    total_available_balance = Column(Float, default=0.0)
    total_pending_balance = Column(Float, default=0.0)

    total_transactions = Column(Integer, default=0)
    pending_transactions_count = Column(Integer, default=0)

    daily_inflow = Column(Float, default=0.0)
    daily_outflow = Column(Float, default=0.0)
    net_cash_flow = Column(Float, default=0.0)

    outstanding_receivables = Column(Float, default=0.0)
    outstanding_payables = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="cash_positions")

    __table_args__ = (
        Index("idx_cash_positions_tenant", "tenant_id"),
        Index("idx_cash_positions_date", "position_date"),
        Index("idx_cash_positions_tenant_date", "tenant_id", "position_date", unique=True),
    )
