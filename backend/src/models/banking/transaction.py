import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime, Text, Boolean, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from ...config.database_config import Base
from .enums import TransactionStatus


class BankTransaction(Base):
    __tablename__ = "bank_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=False)

    transaction_number = Column(String, unique=True, index=True)
    transaction_date = Column(DateTime, nullable=False, index=True)
    value_date = Column(DateTime, nullable=True)
    transaction_type = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False, default=TransactionStatus.PENDING.value)

    amount = Column(Float, nullable=False)
    running_balance = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    exchange_rate = Column(Float, default=1.0)
    base_amount = Column(Float, nullable=False)

    payment_method = Column(String(32), nullable=True)
    reference_number = Column(String, nullable=True)
    external_reference = Column(String, nullable=True)
    check_number = Column(String, nullable=True)

    description = Column(Text, nullable=False)
    memo = Column(Text, nullable=True)
    category = Column(String, nullable=True)

    counterparty_name = Column(String, nullable=True)
    counterparty_account = Column(String, nullable=True)
    counterparty_bank = Column(String, nullable=True)

    is_reconciled = Column(Boolean, default=False)
    reconciled_date = Column(DateTime, nullable=True)
    reconciled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    related_invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    related_purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=True)
    related_expense_id = Column(UUID(as_uuid=True), nullable=True)

    ledger_transaction_id = Column(UUID(as_uuid=True), ForeignKey("ledger_transactions.id"), nullable=True)

    tags = Column(JSON, default=[])
    attachments = Column(JSON, default=[])
    notes = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="bank_transactions")
    bank_account = relationship("BankAccount", back_populates="transactions")
    created_by_user = relationship("User", foreign_keys=[created_by])
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    reconciled_by_user = relationship("User", foreign_keys=[reconciled_by])
    related_invoice = relationship("Invoice")
    related_purchase_order = relationship("PurchaseOrder")
    ledger_transaction = relationship("LedgerTransaction")

    __table_args__ = (
        Index("idx_bank_transactions_tenant", "tenant_id"),
        Index("idx_bank_transactions_account", "bank_account_id"),
        Index("idx_bank_transactions_date", "transaction_date"),
        Index("idx_bank_transactions_type", "transaction_type"),
        Index("idx_bank_transactions_status", "status"),
        Index("idx_bank_transactions_reconciled", "is_reconciled"),
    )
