"""remove job card notes

Revision ID: u1v2w3x4y5z6
Revises: f1a2b3c4d5e6
Create Date: 2026-08-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import (
    column_exists,
    safe_drop_column,
)


revision: str = "u1v2w3x4y5z6"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if column_exists("job_cards", "notes"):
        safe_drop_column("job_cards", "notes")


def downgrade() -> None:
    if not column_exists("job_cards", "notes"):
        op.add_column("job_cards", sa.Column("notes", sa.Text(), nullable=True))
