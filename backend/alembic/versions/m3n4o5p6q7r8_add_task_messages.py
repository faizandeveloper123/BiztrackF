"""add_task_messages

Revision ID: m3n4o5p6q7r8
Revises: l2m3n4o5p6q7
Create Date: 2026-07-15 01:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "m3n4o5p6q7r8"
down_revision: Union[str, None] = "l2m3n4o5p6q7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "task_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("taskId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("authorId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("messageType", sa.String(), nullable=False),
        sa.Column("createdAt", sa.DateTime(), nullable=True),
        sa.Column("updatedAt", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["authorId"], ["users.id"]),
        sa.ForeignKeyConstraint(["taskId"], ["tasks.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_task_messages_id", "task_messages", ["id"])
    op.create_index("ix_task_messages_tenant_id", "task_messages", ["tenant_id"])
    op.create_index("ix_task_messages_taskId", "task_messages", ["taskId"])
    op.create_index("ix_task_messages_authorId", "task_messages", ["authorId"])


def downgrade() -> None:
    op.drop_index("ix_task_messages_authorId", table_name="task_messages")
    op.drop_index("ix_task_messages_taskId", table_name="task_messages")
    op.drop_index("ix_task_messages_tenant_id", table_name="task_messages")
    op.drop_index("ix_task_messages_id", table_name="task_messages")
    op.drop_table("task_messages")
