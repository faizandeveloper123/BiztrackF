"""add purchase order status column

Revision ID: v1w2x3y4z5a6
Revises: t0u1v2w3x4y5
Create Date: 2026-08-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import column_exists


revision: str = "v1w2x3y4z5a6"
down_revision: Union[str, None] = "t0u1v2w3x4y5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("purchase_orders", "status"):
        op.add_column(
            "purchase_orders",
            sa.Column("status", sa.String(), server_default="draft", nullable=True),
        )


def downgrade() -> None:
    if column_exists("purchase_orders", "status"):
        op.drop_column("purchase_orders", "status")
