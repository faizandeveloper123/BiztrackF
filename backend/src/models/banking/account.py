import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, Text, Boolean, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base
from .enums import BankAccountType


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)

    account_name = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    routing_number = Column(String, nullable=True)
    bank_name = Column(String, nullable=False)
    bank_code = Column(String, nullable=True)
    account_type = Column(String(32), nullable=False, default=BankAccountType.CHECKING.value)
    currency = Column(String, default="USD")

    current_balance = Column(Float, default=0.0)
    available_balance = Column(Float, default=0.0)
    pending_balance = Column(Float, default=0.0)

    is_active = Column(Boolean, default=True)
    is_primary = Column(Boolean, default=False)

    supports_online_banking = Column(Boolean, default=False)
    api_credentials = Column(JSON, nullable=True)
    last_sync_date = Column(DateTime, nullable=True)

    description = Column(Text, nullable=True)
    tags = Column(JSON, default=[])
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="bank_accounts")
    transactions = relationship("BankTransaction", back_populates="bank_account")
    created_by_user = relationship("User", foreign_keys=[created_by])

    __table_args__ = (
        Index("idx_bank_accounts_tenant", "tenant_id"),
        Index("idx_bank_accounts_active", "is_active"),
        Index("idx_bank_accounts_primary", "is_primary"),
    )
