"""add mot_reminder_sent_at to mot_bookings

Revision ID: b7c8d9e0f1a2
Revises: w2x3y4z5a6b7
Create Date: 2026-08-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import column_exists


revision: str = "b7c8d9e0f1a2"
down_revision: Union[str, None] = "w2x3y4z5a6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not column_exists("mot_bookings", "mot_reminder_sent_at"):
        op.add_column(
            "mot_bookings",
            sa.Column("mot_reminder_sent_at", sa.DateTime(), nullable=True),
        )


def downgrade() -> None:
    if column_exists("mot_bookings", "mot_reminder_sent_at"):
        op.drop_column("mot_bookings", "mot_reminder_sent_at")
