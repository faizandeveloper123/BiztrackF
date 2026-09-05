"""remove invoice-level paymentTerms, currency, taxRate, discount, notes

Revision ID: e4f5a6b7c8d9
Revises: d2e3f4a5b6c7
Create Date: 2026-08-05 17:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import column_exists


revision: str = "e4f5a6b7c8d9"
down_revision: Union[str, None] = "d2e3f4a5b6c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for column in ("paymentTerms", "currency", "taxRate", "discount", "notes"):
        if column_exists("invoices", column):
            op.drop_column("invoices", column)


def downgrade() -> None:
    if not column_exists("invoices", "paymentTerms"):
        op.add_column("invoices", sa.Column("paymentTerms", sa.String(), nullable=True))
    if not column_exists("invoices", "currency"):
        op.add_column(
            "invoices",
            sa.Column("currency", sa.String(), nullable=True, server_default=sa.text("'USD'")),
        )
    if not column_exists("invoices", "taxRate"):
        op.add_column(
            "invoices",
            sa.Column("taxRate", sa.Float(), nullable=True, server_default=sa.text("0")),
        )
    if not column_exists("invoices", "discount"):
        op.add_column(
            "invoices",
            sa.Column("discount", sa.Float(), nullable=True, server_default=sa.text("0")),
        )
    if not column_exists("invoices", "notes"):
        op.add_column("invoices", sa.Column("notes", sa.Text(), nullable=True))
