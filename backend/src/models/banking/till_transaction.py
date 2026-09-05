import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey, Index, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base
from .enums import TillTransactionType, pg_enum_values


class TillTransaction(Base):
    __tablename__ = "till_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    till_id = Column(UUID(as_uuid=True), ForeignKey("tills.id"), nullable=False)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=True)

    transaction_number = Column(String, unique=True, index=True)
    transaction_date = Column(DateTime, nullable=False, index=True)
    transaction_type = Column(SQLEnum(TillTransactionType, values_callable=pg_enum_values), nullable=False)

    amount = Column(Float, nullable=False)
    running_balance = Column(Float, nullable=False)
    currency = Column(String, default="USD")

    description = Column(Text, nullable=False)
    reason = Column(String, nullable=True)
    reference_number = Column(String, nullable=True)

    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="till_transactions")
    till = relationship("Till", back_populates="transactions")
    bank_account = relationship("BankAccount", foreign_keys=[bank_account_id])
    performed_by_user = relationship("User", foreign_keys=[performed_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])

    __table_args__ = (
        Index("idx_till_transactions_tenant", "tenant_id"),
        Index("idx_till_transactions_till", "till_id"),
        Index("idx_till_transactions_date", "transaction_date"),
        Index("idx_till_transactions_type", "transaction_type"),
    )
