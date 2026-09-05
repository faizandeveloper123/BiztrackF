"""add_project_deletion_approval_fields

Revision ID: h8i9j0k1l2m3
Revises: g7h8i9j0k1l2
Create Date: 2026-07-04 03:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'h8i9j0k1l2m3'
down_revision: Union[str, None] = 'g7h8i9j0k1l2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projects', sa.Column('deletionStatus', sa.String(), nullable=False, server_default='none'))
    op.add_column('projects', sa.Column('deletionRequestedById', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('projects', sa.Column('deletionRequestedAt', sa.DateTime(), nullable=True))
    op.create_foreign_key(
        'fk_projects_deletion_requested_by',
        'projects', 'users',
        ['deletionRequestedById'], ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_projects_deletion_requested_by', 'projects', type_='foreignkey')
    op.drop_column('projects', 'deletionRequestedAt')
    op.drop_column('projects', 'deletionRequestedById')
    op.drop_column('projects', 'deletionStatus')
