import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database_config import Base


class InstallmentPlan(Base):
    __tablename__ = "installment_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    number_of_installments = Column(Integer, nullable=False)
    frequency = Column(String, nullable=False)
    first_due_date = Column(DateTime, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant")
    invoice = relationship("Invoice", foreign_keys=[invoice_id])
    installments = relationship("Installment", back_populates="installment_plan", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_installment_plans_tenant_id", "tenant_id"),
        Index("idx_installment_plans_invoice_id", "invoice_id"),
        Index("idx_installment_plans_status", "status"),
    )


class Installment(Base):
    __tablename__ = "installments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    installment_plan_id = Column(UUID(as_uuid=True), ForeignKey("installment_plans.id"), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    due_date = Column(DateTime, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="pending")
    paid_amount = Column(Float, default=0.0)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant")
    installment_plan = relationship("InstallmentPlan", back_populates="installments")
    payment = relationship("Payment", foreign_keys=[payment_id])

    __table_args__ = (
        Index("idx_installments_tenant_id", "tenant_id"),
        Index("idx_installments_plan_id", "installment_plan_id"),
        Index("idx_installments_due_date", "due_date"),
        Index("idx_installments_status", "status"),
    )
