import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Float, Integer, Text, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base

class CustomerGuarantor(Base):
    __tablename__ = "customer_guarantors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    name = Column(String, nullable=False)
    mobile = Column(String, nullable=True)
    cnic = Column(String, nullable=True)
    residential_address = Column(Text, nullable=True)
    official_address = Column(Text, nullable=True)
    occupation = Column(String, nullable=True)
    relation = Column(String, nullable=True)
    display_order = Column(Integer, default=0)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant")
    customer = relationship("Customer", back_populates="guarantors")
    
    __table_args__ = (
        Index("idx_customer_guarantors_tenant_id", "tenant_id"),
        Index("idx_customer_guarantors_customer_id", "customer_id"),
    )

