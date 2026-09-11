"""add whatsapp_number to mot_bookings

Revision ID: x1y2z3a4b5c6
Revises: a9b8c7d6e5f4
Create Date: 2026-09-10 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import column_exists


revision: str = "x1y2z3a4b5c6"
down_revision: Union[str, None] = "a9b8c7d6e5f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("mot_bookings", "whatsapp_number"):
        op.add_column(
            "mot_bookings",
            sa.Column("whatsapp_number", sa.String(50), nullable=True),
        )


def downgrade() -> None:
    if column_exists("mot_bookings", "whatsapp_number"):
        op.drop_column("mot_bookings", "whatsapp_number")