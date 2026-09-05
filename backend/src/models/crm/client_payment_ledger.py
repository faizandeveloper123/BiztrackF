import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ...config.database_config import Base


class ClientPaymentLedger(Base):
    __tablename__ = "client_payment_ledger"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    contactId = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    opportunityId = Column(UUID(as_uuid=True), ForeignKey("opportunities.id"), nullable=True)
    invoiceId = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    paymentId = Column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True)
    installmentId = Column(UUID(as_uuid=True), ForeignKey("installments.id"), nullable=True)
    assignedToId = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    entryType = Column(String, nullable=False)
    revenueType = Column(String, nullable=False, default="realized")
    amount = Column(Float, nullable=False, default=0.0)
    description = Column(Text, nullable=True)
    entryDate = Column(DateTime, nullable=False, default=datetime.utcnow)
    createdAt = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant")
    contact = relationship("Contact", foreign_keys=[contactId])

    __table_args__ = (
        Index("idx_client_payment_ledger_tenant_contact", "tenant_id", "contactId"),
        Index("idx_client_payment_ledger_tenant_agent", "tenant_id", "assignedToId"),
        Index("idx_client_payment_ledger_entry_date", "entryDate"),
    )
