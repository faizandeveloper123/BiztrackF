from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base

DEFAULT_MOT_INSPECTION_PRICE = Decimal("49.00")


class MotSettings(Base):
    __tablename__ = "mot_settings"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), primary_key=True)
    inspection_price = Column(Numeric(10, 2), nullable=False, default=DEFAULT_MOT_INSPECTION_PRICE)
    public_booking_enabled = Column(Boolean, nullable=False, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
