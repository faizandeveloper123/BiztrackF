import uuid
from sqlalchemy import Column, String, DateTime, Float, Text, Boolean, ForeignKey, Integer, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from .database_config import Base
import enum

class InvestmentType(str, enum.Enum):
    CASH_INVESTMENT = "cash_investment"
    CARD_TRANSFER = "card_transfer"
    BANK_TRANSFER = "bank_transfer"
    EQUIPMENT_PURCHASE = "equipment_purchase"

class InvestmentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class Investment(Base):
    __tablename__ = "investments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    investment_number = Column(String, unique=True, index=True)
    investment_date = Column(DateTime, nullable=False, index=True)
    investment_type = Column(Enum(InvestmentType), nullable=False)
    status = Column(Enum(InvestmentStatus), default=InvestmentStatus.PENDING)
    
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    
    description = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    
    reference_number = Column(String, nullable=True)
    reference_type = Column(String, nullable=True)
    
    meta_data = Column(JSON, default={})
    tags = Column(JSON, default=[])
    attachments = Column(JSON, default=[])
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="investments")
    created_by_user = relationship("User", foreign_keys=[created_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    transactions = relationship("InvestmentTransaction", back_populates="investment")
    equipment_details = relationship("EquipmentInvestment", back_populates="investment")

class EquipmentInvestment(Base):
    __tablename__ = "equipment_investments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    investment_id = Column(UUID(as_uuid=True), ForeignKey("investments.id"), nullable=False)
    
    equipment_name = Column(String, nullable=False)
    equipment_type = Column(String, nullable=False)
    manufacturer = Column(String, nullable=True)
    model_number = Column(String, nullable=True)
    serial_number = Column(String, nullable=True)
    
    purchase_price = Column(Float, nullable=False)
    estimated_life_years = Column(Integer, default=5)
    depreciation_method = Column(String, default="straight_line")
    
    purchase_date = Column(DateTime, nullable=False)
    warranty_expiry = Column(DateTime, nullable=True)
    
    location = Column(String, nullable=True)
    condition = Column(String, default="new")
    
    notes = Column(Text, nullable=True)
    attachments = Column(JSON, default=[])
    
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="equipment_investments")
    investment = relationship("Investment", back_populates="equipment_details")
    created_by_user = relationship("User", foreign_keys=[created_by])

class InvestmentTransaction(Base):
    __tablename__ = "investment_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    investment_id = Column(UUID(as_uuid=True), ForeignKey("investments.id"), nullable=False)
    
    transaction_date = Column(DateTime, nullable=False)
    transaction_type = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    
    debit_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    credit_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    
    description = Column(Text, nullable=False)
    reference_number = Column(String, nullable=True)
    
    status = Column(String, default="pending")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tenant = relationship("Tenant", back_populates="investment_transactions")
    investment = relationship("Investment", back_populates="transactions")
    debit_account = relationship("ChartOfAccounts", foreign_keys=[debit_account_id])
    credit_account = relationship("ChartOfAccounts", foreign_keys=[credit_account_id])
    created_by_user = relationship("User", foreign_keys=[created_by])
