"""add labourCost column to invoices

Revision ID: d2e3f4a5b6c7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-05 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import column_exists


revision: str = "d2e3f4a5b6c7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("invoices", "labourCost"):
        op.add_column(
            "invoices",
            sa.Column(
                "labourCost",
                sa.Float(),
                nullable=True,
                server_default=sa.text("0"),
            ),
        )


def downgrade() -> None:
    if column_exists("invoices", "labourCost"):
        op.drop_column("invoices", "labourCost")
