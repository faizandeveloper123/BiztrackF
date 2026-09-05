"""add stripe_required to tenants

Revision ID: x9y8z7w6v5u4
Revises: b7c8d9e0f1a2
Create Date: 2026-09-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import column_exists


revision: str = "x9y8z7w6v5u4"
down_revision: Union[str, None] = "b7c8d9e0f1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("tenants", "stripe_required"):
        op.add_column(
            "tenants",
            sa.Column(
                "stripe_required",
                sa.Boolean(),
                server_default=sa.text("false"),
                nullable=False,
            ),
        )


def downgrade() -> None:
    if column_exists("tenants", "stripe_required"):
        op.drop_column("tenants", "stripe_required")