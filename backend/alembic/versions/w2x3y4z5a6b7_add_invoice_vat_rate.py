"""add vatRate to invoices

Revision ID: w2x3y4z5a6b7
Revises: u1v2w3x4y5z6
Create Date: 2026-08-18 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import column_exists


revision: str = "w2x3y4z5a6b7"
down_revision: Union[str, None] = "u1v2w3x4y5z6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("invoices", "vatRate"):
        op.add_column(
            "invoices",
            sa.Column("vatRate", sa.Float(), server_default="0", nullable=True),
        )


def downgrade() -> None:
    if column_exists("invoices", "vatRate"):
        op.drop_column("invoices", "vatRate")