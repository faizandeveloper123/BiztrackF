"""add items JSON column to purchase_orders

Revision ID: a1b2c3d4e5f6
Revises: v1w2x3y4z5a6
Create Date: 2026-08-05 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import column_exists


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "v1w2x3y4z5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("purchase_orders", "items"):
        op.add_column(
            "purchase_orders",
            sa.Column(
                "items",
                sa.JSON(),
                server_default=sa.text("'[]'::json"),
                nullable=True,
            ),
        )


def downgrade() -> None:
    if column_exists("purchase_orders", "items"):
        op.drop_column("purchase_orders", "items")
