import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base


class POSTransaction(Base):
    __tablename__ = "pos_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    transactionNumber = Column(String, unique=True, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    shiftId = Column(UUID(as_uuid=True), ForeignKey("pos_shifts.id"), nullable=False)
    customerId = Column(String, nullable=True)
    customerName = Column(String, nullable=True)
    items = Column(JSON, nullable=False)
    subtotal = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    taxAmount = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    paymentMethod = Column(String, nullable=False)
    paymentStatus = Column(String, default="completed")
    notes = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)

    shift = relationship("POSShift", back_populates="transactions")
    tenant = relationship("Tenant", back_populates="pos_transactions")
