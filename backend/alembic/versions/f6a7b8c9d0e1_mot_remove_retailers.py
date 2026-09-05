"""remove mot retailers

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-09 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_utils import (
    column_exists,
    index_exists,
    safe_drop_column,
    safe_drop_constraint,
    safe_drop_index,
    table_exists,
)


revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if table_exists('mot_bookings'):
        safe_drop_constraint('mot_bookings_retailer_id_fkey', 'mot_bookings')
        safe_drop_column('mot_bookings', 'retailer_id')

    if table_exists('mot_retailers'):
        safe_drop_index('ix_mot_retailers_is_default', 'mot_retailers')
        safe_drop_index('ix_mot_retailers_id', 'mot_retailers')
        op.drop_table('mot_retailers')


def downgrade() -> None:
    if not table_exists('mot_retailers'):
        op.create_table(
            'mot_retailers',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('address_line1', sa.String(length=255), nullable=False),
            sa.Column('address_line2', sa.String(length=255), nullable=True),
            sa.Column('city', sa.String(length=100), nullable=False),
            sa.Column('county', sa.String(length=100), nullable=True),
            sa.Column('postcode', sa.String(length=20), nullable=False),
            sa.Column('phone', sa.String(length=50), nullable=True),
            sa.Column('email', sa.String(length=255), nullable=True),
            sa.Column('is_default', sa.Boolean(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index(op.f('ix_mot_retailers_id'), 'mot_retailers', ['id'], unique=False)
        op.create_index('ix_mot_retailers_is_default', 'mot_retailers', ['is_default'], unique=False)

    if table_exists('mot_bookings') and not column_exists('mot_bookings', 'retailer_id'):
        op.add_column('mot_bookings', sa.Column('retailer_id', postgresql.UUID(as_uuid=True), nullable=True))
        op.create_foreign_key(
            'mot_bookings_retailer_id_fkey',
            'mot_bookings',
            'mot_retailers',
            ['retailer_id'],
            ['id'],
            ondelete='SET NULL',
        )
