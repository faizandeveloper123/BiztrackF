"""add_task_duration_reminder_fields

Revision ID: b2c3d4e5f6a7
Revises: 71b12164f670
Create Date: 2026-06-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = '71b12164f670'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('estimatedDurationSeconds', sa.Integer(), nullable=True))
    op.add_column('tasks', sa.Column('reminderThresholdSeconds', sa.Integer(), nullable=True))
    op.add_column('tasks', sa.Column('timeReminderSentAt', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('tasks', 'timeReminderSentAt')
    op.drop_column('tasks', 'reminderThresholdSeconds')
    op.drop_column('tasks', 'estimatedDurationSeconds')
