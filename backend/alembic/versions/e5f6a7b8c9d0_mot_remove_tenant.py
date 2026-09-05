"""mot standalone tables remove tenant scoping

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import (
    column_exists,
    index_exists,
    safe_create_index,
    safe_drop_column,
    safe_drop_constraint,
    safe_drop_index,
    table_exists,
)


revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not table_exists('mot_bookings'):
        return

    safe_drop_index('ix_mot_bookings_tenant_status', 'mot_bookings')
    safe_drop_index('ix_mot_bookings_tenant_date', 'mot_bookings')
    safe_drop_index('ix_mot_bookings_tenant_id', 'mot_bookings')
    safe_drop_constraint('mot_bookings_work_order_id_fkey', 'mot_bookings')
    safe_drop_constraint('mot_bookings_assigned_technician_id_fkey', 'mot_bookings')
    safe_drop_constraint('mot_bookings_vehicle_id_fkey', 'mot_bookings')
    safe_drop_constraint('mot_bookings_customer_id_fkey', 'mot_bookings')
    safe_drop_constraint('mot_bookings_tenant_id_fkey', 'mot_bookings')
    safe_drop_column('mot_bookings', 'work_order_id')
    safe_drop_column('mot_bookings', 'assigned_technician_id')
    safe_drop_column('mot_bookings', 'vehicle_id')
    safe_drop_column('mot_bookings', 'customer_id')
    safe_drop_column('mot_bookings', 'tenant_id')
    safe_create_index('ix_mot_bookings_booking_date', 'mot_bookings', ['booking_date'])
    safe_create_index('ix_mot_bookings_status', 'mot_bookings', ['status'])

    if not table_exists('mot_retailers'):
        return

    safe_drop_index('ix_mot_retailers_tenant_default', 'mot_retailers')
    safe_drop_index('ix_mot_retailers_tenant_id', 'mot_retailers')
    safe_drop_constraint('mot_retailers_tenant_id_fkey', 'mot_retailers')
    safe_drop_column('mot_retailers', 'tenant_id')
    safe_create_index('ix_mot_retailers_is_default', 'mot_retailers', ['is_default'])


def downgrade() -> None:
    if table_exists('mot_retailers'):
        if index_exists('mot_retailers', 'ix_mot_retailers_is_default'):
            op.drop_index('ix_mot_retailers_is_default', table_name='mot_retailers')
        if not column_exists('mot_retailers', 'tenant_id'):
            op.add_column('mot_retailers', sa.Column('tenant_id', sa.UUID(), nullable=False))
            op.create_foreign_key(
                'mot_retailers_tenant_id_fkey',
                'mot_retailers',
                'tenants',
                ['tenant_id'],
                ['id'],
                ondelete='CASCADE',
            )
        safe_create_index('ix_mot_retailers_tenant_id', 'mot_retailers', ['tenant_id'])
        safe_create_index('ix_mot_retailers_tenant_default', 'mot_retailers', ['tenant_id', 'is_default'])

    if not table_exists('mot_bookings'):
        return

    if index_exists('mot_bookings', 'ix_mot_bookings_status'):
        op.drop_index('ix_mot_bookings_status', table_name='mot_bookings')
    if index_exists('mot_bookings', 'ix_mot_bookings_booking_date'):
        op.drop_index('ix_mot_bookings_booking_date', table_name='mot_bookings')
    if not column_exists('mot_bookings', 'tenant_id'):
        op.add_column('mot_bookings', sa.Column('tenant_id', sa.UUID(), nullable=False))
    if not column_exists('mot_bookings', 'customer_id'):
        op.add_column('mot_bookings', sa.Column('customer_id', sa.UUID(), nullable=True))
    if not column_exists('mot_bookings', 'vehicle_id'):
        op.add_column('mot_bookings', sa.Column('vehicle_id', sa.UUID(), nullable=True))
    if not column_exists('mot_bookings', 'assigned_technician_id'):
        op.add_column('mot_bookings', sa.Column('assigned_technician_id', sa.UUID(), nullable=True))
    if not column_exists('mot_bookings', 'work_order_id'):
        op.add_column('mot_bookings', sa.Column('work_order_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'mot_bookings_tenant_id_fkey',
        'mot_bookings',
        'tenants',
        ['tenant_id'],
        ['id'],
        ondelete='CASCADE',
    )
    op.create_foreign_key(
        'mot_bookings_customer_id_fkey',
        'mot_bookings',
        'customers',
        ['customer_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_foreign_key(
        'mot_bookings_vehicle_id_fkey',
        'mot_bookings',
        'vehicles',
        ['vehicle_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_foreign_key(
        'mot_bookings_assigned_technician_id_fkey',
        'mot_bookings',
        'users',
        ['assigned_technician_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_foreign_key(
        'mot_bookings_work_order_id_fkey',
        'mot_bookings',
        'work_orders',
        ['work_order_id'],
        ['id'],
        ondelete='SET NULL',
    )
    safe_create_index('ix_mot_bookings_tenant_id', 'mot_bookings', ['tenant_id'])
    safe_create_index('ix_mot_bookings_tenant_date', 'mot_bookings', ['tenant_id', 'booking_date'])
    safe_create_index('ix_mot_bookings_tenant_status', 'mot_bookings', ['tenant_id', 'status'])
