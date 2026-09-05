import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ...config.database_config import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    planType = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    billingCycle = Column(String, nullable=False)
    maxProjects = Column(Integer)
    maxUsers = Column(Integer)
    features = Column(JSON)
    modules = Column(JSON, default=[])
    isActive = Column(Boolean, default=True)
    paypal_plan_id = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    planId = Column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False)
    status = Column(String, nullable=False, default="trial")
    isActive = Column(Boolean, default=True)
    startDate = Column(DateTime, nullable=False)
    endDate = Column(DateTime)
    autoRenew = Column(Boolean, default=True)
    stripe_customer_id = Column(String, nullable=True, index=True)
    stripe_subscription_id = Column(String, nullable=True, index=True)
    stripe_payment_method_id = Column(String, nullable=True)
    stripe_price_id = Column(String, nullable=True)
    payment_provider = Column(String, nullable=True, index=True)
    paypal_subscription_id = Column(String, nullable=True, index=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
