"""mot tenant scoped bookings and settings

Revision ID: g7h8i9j0k1l2
Revises: a7b8c9d0e1f2
Create Date: 2026-06-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_utils import (
    column_exists,
    index_exists,
    safe_create_index,
    safe_drop_index,
    table_exists,
)


revision: str = 'g7h8i9j0k1l2'
down_revision: Union[str, None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if table_exists('mot_bookings') and not column_exists('mot_bookings', 'tenant_id'):
        op.add_column(
            'mot_bookings',
            sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=True),
        )
        op.execute('DELETE FROM mot_bookings')
        op.alter_column('mot_bookings', 'tenant_id', nullable=False)
        op.create_foreign_key(
            'mot_bookings_tenant_id_fkey',
            'mot_bookings',
            'tenants',
            ['tenant_id'],
            ['id'],
            ondelete='CASCADE',
        )
        safe_create_index('ix_mot_bookings_tenant_id', 'mot_bookings', ['tenant_id'])
        safe_create_index('ix_mot_bookings_tenant_date', 'mot_bookings', ['tenant_id', 'booking_date'])
        safe_create_index('ix_mot_bookings_tenant_status', 'mot_bookings', ['tenant_id', 'status'])

    if table_exists('mot_settings'):
        op.drop_table('mot_settings')

    op.create_table(
        'mot_settings',
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('inspection_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('public_booking_enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('tenant_id'),
    )


def downgrade() -> None:
    if table_exists('mot_settings'):
        op.drop_table('mot_settings')

    op.create_table(
        'mot_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('inspection_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.execute(
        "INSERT INTO mot_settings (id, inspection_price, updated_at) VALUES (1, 49.00, NOW())"
    )

    if not table_exists('mot_bookings'):
        return

    if index_exists('mot_bookings', 'ix_mot_bookings_tenant_status'):
        op.drop_index('ix_mot_bookings_tenant_status', table_name='mot_bookings')
    if index_exists('mot_bookings', 'ix_mot_bookings_tenant_date'):
        op.drop_index('ix_mot_bookings_tenant_date', table_name='mot_bookings')
    if index_exists('mot_bookings', 'ix_mot_bookings_tenant_id'):
        op.drop_index('ix_mot_bookings_tenant_id', table_name='mot_bookings')
    op.drop_constraint('mot_bookings_tenant_id_fkey', 'mot_bookings', type_='foreignkey')
    op.drop_column('mot_bookings', 'tenant_id')
