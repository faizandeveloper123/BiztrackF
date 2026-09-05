import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Date, Text, ForeignKey, Index, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from ...config.database_config import Base


class DailyExpense(Base):
    __tablename__ = "healthcare_daily_expenses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("healthcare_expense_categories.id", ondelete="RESTRICT"), nullable=False)
    expense_date = Column(Date, nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_healthcare_daily_expenses_tenant_id", "tenant_id"),
        Index("ix_healthcare_daily_expenses_category_id", "category_id"),
        Index("ix_healthcare_daily_expenses_expense_date", "tenant_id", "expense_date"),
    )

    tenant = relationship("Tenant")
    category = relationship("ExpenseCategory", back_populates="expenses")
