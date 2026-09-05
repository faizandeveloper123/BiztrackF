import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, Text, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    invoiceNumber = Column(String, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    createdBy = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    customerId = Column(String, nullable=True)
    customerName = Column(String, nullable=False)
    customerEmail = Column(String, nullable=True)
    customerPhone = Column(String, nullable=True)
    billingAddress = Column(Text, nullable=True)
    shippingAddress = Column(Text, nullable=True)
    customerCity = Column(String, nullable=True)
    customerState = Column(String, nullable=True)
    customerPostalCode = Column(String, nullable=True)
    customerCountry = Column(String, nullable=True)
    issueDate = Column(DateTime, nullable=False)
    dueDate = Column(DateTime, nullable=False)
    orderNumber = Column(String, nullable=True)
    orderTime = Column(DateTime, nullable=True)
    subtotal = Column(Float, default=0.0)
    discountAmount = Column(Float, default=0.0)
    taxAmount = Column(Float, default=0.0)
    vatRate = Column(Float, default=0.0)
    labourCost = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    terms = Column(Text, nullable=True)
    contactId = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    opportunityId = Column(String, nullable=True)
    quoteId = Column(String, nullable=True)
    projectId = Column(String, nullable=True)
    status = Column(String, default="draft")
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow)
    paidAt = Column(DateTime, nullable=True)
    sentAt = Column(DateTime, nullable=True)
    totalPaid = Column(Float, default=0.0)
    balance = Column(Float, default=0.0)
    items = Column(JSON, default=[])
    vehicleReg = Column(String, nullable=True)
    jobCardId = Column(UUID(as_uuid=True), ForeignKey("job_cards.id"), nullable=True)
    payments = relationship("Payment", back_populates="invoice")
    tenant = relationship("Tenant", back_populates="invoices")
    creator = relationship("User", back_populates="created_invoices")

    __table_args__ = (
        Index("idx_invoices_tenant_id", "tenant_id"),
        Index("idx_invoices_status", "status"),
        Index("idx_invoices_created_at", "createdAt"),
        Index("idx_invoices_due_date", "dueDate"),
        Index("idx_invoices_customer_id", "customerId"),
        Index("idx_invoices_tenant_status", "tenant_id", "status"),
        Index("idx_invoices_tenant_due_date", "tenant_id", "dueDate"),
    )
