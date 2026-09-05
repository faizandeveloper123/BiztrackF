"""remove purchase order invoiceId, vatRate, and items

Revision ID: q7r8s9t0u1v2
Revises: p6q7r8s9t0u1
Create Date: 2026-08-04 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_utils import (
    column_exists,
    safe_drop_column,
    safe_drop_constraint,
)


revision: str = "q7r8s9t0u1v2"
down_revision: Union[str, None] = "p6q7r8s9t0u1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if column_exists("purchase_orders", "invoiceId"):
        safe_drop_constraint("fk_purchase_orders_invoice_id", "purchase_orders", "foreignkey")
        safe_drop_column("purchase_orders", "invoiceId")

    if column_exists("purchase_orders", "vatRate"):
        safe_drop_column("purchase_orders", "vatRate")

    if column_exists("purchase_orders", "items"):
        safe_drop_column("purchase_orders", "items")


def downgrade() -> None:
    if not column_exists("purchase_orders", "items"):
        op.add_column(
            "purchase_orders",
            sa.Column("items", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        )

    if not column_exists("purchase_orders", "vatRate"):
        op.add_column(
            "purchase_orders",
            sa.Column("vatRate", sa.Float(), nullable=True, server_default="0"),
        )

    if not column_exists("purchase_orders", "invoiceId"):
        op.add_column(
            "purchase_orders",
            sa.Column("invoiceId", postgresql.UUID(as_uuid=True), nullable=True),
        )
        op.create_foreign_key(
            "fk_purchase_orders_invoice_id",
            "purchase_orders",
            "invoices",
            ["invoiceId"],
            ["id"],
        )
