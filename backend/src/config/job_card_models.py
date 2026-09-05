import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Text, JSON, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .database_config import Base


class JobCard(Base):
    __tablename__ = "job_cards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    job_card_number = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="draft")
    priority = Column(String, default="medium")
    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=True)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    customer_name = Column(String)
    customer_phone = Column(String)
    vehicle_info = Column(JSON, default=dict)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    planned_date = Column(DateTime)
    completed_at = Column(DateTime)
    labor_estimate = Column(Float, default=0.0)
    parts_estimate = Column(Float, default=0.0)
    vat_rate = Column(Float, default=0.15)
    attachments = Column(JSON, default=[])
    items = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant")
    customer = relationship("Customer", foreign_keys=[customer_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    created_by = relationship("User", foreign_keys=[created_by_id])

    __table_args__ = (
        Index("idx_job_cards_tenant_id", "tenant_id"),
        Index("idx_job_cards_status", "status"),
        Index("idx_job_cards_customer_id", "customer_id"),
        Index("idx_job_cards_job_card_number", "job_card_number"),
        Index("idx_job_cards_assigned_to", "assigned_to_id"),
    )
