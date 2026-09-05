import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    invoiceId = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    amount = Column(Float, nullable=False)
    paymentDate = Column(DateTime, nullable=False)
    paymentMethod = Column(String, nullable=False)
    reference = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String, default="pending")
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    invoice = relationship("Invoice", back_populates="payments")
    tenant = relationship("Tenant", back_populates="payments")
