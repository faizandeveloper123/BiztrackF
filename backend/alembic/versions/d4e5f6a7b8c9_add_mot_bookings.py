"""add_mot_workshop_tables

Revision ID: d4e5f6a7b8c9
Revises: c8d9e0f1a2b3
Create Date: 2026-06-08 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_utils import column_exists, index_exists, table_exists


revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c8d9e0f1a2b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if not table_exists('mot_retailers'):
        op.create_table(
            'mot_retailers',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('address_line1', sa.String(length=255), nullable=False),
            sa.Column('address_line2', sa.String(length=255), nullable=True),
            sa.Column('city', sa.String(length=100), nullable=False),
            sa.Column('county', sa.String(length=100), nullable=True),
            sa.Column('postcode', sa.String(length=20), nullable=False),
            sa.Column('phone', sa.String(length=50), nullable=True),
            sa.Column('email', sa.String(length=255), nullable=True),
            sa.Column('is_default', sa.Boolean(), server_default=sa.text('false'), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_mot_retailers_tenant_id', 'mot_retailers', ['tenant_id'], unique=False)
        op.create_index(
            'ix_mot_retailers_tenant_default',
            'mot_retailers',
            ['tenant_id', 'is_default'],
            unique=False,
        )
        op.create_index(op.f('ix_mot_retailers_id'), 'mot_retailers', ['id'], unique=False)

    if not table_exists('mot_bookings'):
        op.create_table(
            'mot_bookings',
            sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('customer_name', sa.String(length=255), nullable=False),
            sa.Column('customer_phone', sa.String(length=50), nullable=True),
            sa.Column('customer_email', sa.String(length=255), nullable=True),
            sa.Column('vehicle_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('vehicle_registration', sa.String(length=50), nullable=True),
            sa.Column('vehicle_make', sa.String(length=100), nullable=True),
            sa.Column('vehicle_model', sa.String(length=100), nullable=True),
            sa.Column('vehicle_year', sa.String(length=10), nullable=True),
            sa.Column('retailer_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('delivery_option', sa.String(length=50), nullable=True),
            sa.Column('booking_meta', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            sa.Column('booking_date', sa.Date(), nullable=False),
            sa.Column('start_time', sa.String(length=10), nullable=False),
            sa.Column('end_time', sa.String(length=10), nullable=False),
            sa.Column('test_type', sa.String(length=50), server_default='standard', nullable=True),
            sa.Column('status', sa.String(length=50), server_default='scheduled', nullable=True),
            sa.Column('price', sa.Numeric(precision=12, scale=2), server_default='0', nullable=True),
            sa.Column('mileage', sa.String(length=50), nullable=True),
            sa.Column('mot_expiry_date', sa.Date(), nullable=True),
            sa.Column('assigned_technician_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('result_notes', sa.Text(), nullable=True),
            sa.Column('work_order_id', postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
            sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['vehicle_id'], ['vehicles.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['retailer_id'], ['mot_retailers.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['assigned_technician_id'], ['users.id'], ondelete='SET NULL'),
            sa.ForeignKeyConstraint(['work_order_id'], ['work_orders.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id'),
        )
        op.create_index('ix_mot_bookings_tenant_id', 'mot_bookings', ['tenant_id'], unique=False)
        op.create_index(
            'ix_mot_bookings_tenant_date',
            'mot_bookings',
            ['tenant_id', 'booking_date'],
            unique=False,
        )
        op.create_index(
            'ix_mot_bookings_tenant_status',
            'mot_bookings',
            ['tenant_id', 'status'],
            unique=False,
        )
        op.create_index(op.f('ix_mot_bookings_id'), 'mot_bookings', ['id'], unique=False)
    else:
        if not column_exists('mot_bookings', 'vehicle_year'):
            op.add_column('mot_bookings', sa.Column('vehicle_year', sa.String(length=10), nullable=True))
        if not column_exists('mot_bookings', 'retailer_id'):
            op.add_column(
                'mot_bookings',
                sa.Column('retailer_id', postgresql.UUID(as_uuid=True), nullable=True),
            )
        if not column_exists('mot_bookings', 'delivery_option'):
            op.add_column('mot_bookings', sa.Column('delivery_option', sa.String(length=50), nullable=True))
        if not column_exists('mot_bookings', 'booking_meta'):
            op.add_column(
                'mot_bookings',
                sa.Column('booking_meta', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
            )
        if not index_exists('mot_bookings', 'ix_mot_bookings_tenant_id'):
            op.create_index('ix_mot_bookings_tenant_id', 'mot_bookings', ['tenant_id'], unique=False)
        if not index_exists('mot_bookings', 'ix_mot_bookings_tenant_date'):
            op.create_index(
                'ix_mot_bookings_tenant_date',
                'mot_bookings',
                ['tenant_id', 'booking_date'],
                unique=False,
            )
        if not index_exists('mot_bookings', 'ix_mot_bookings_tenant_status'):
            op.create_index(
                'ix_mot_bookings_tenant_status',
                'mot_bookings',
                ['tenant_id', 'status'],
                unique=False,
            )
        if not index_exists('mot_bookings', 'ix_mot_bookings_id'):
            op.create_index(op.f('ix_mot_bookings_id'), 'mot_bookings', ['id'], unique=False)


def downgrade() -> None:
    if index_exists('mot_bookings', 'ix_mot_bookings_id'):
        op.drop_index(op.f('ix_mot_bookings_id'), table_name='mot_bookings')
    if index_exists('mot_bookings', 'ix_mot_bookings_tenant_status'):
        op.drop_index('ix_mot_bookings_tenant_status', table_name='mot_bookings')
    if index_exists('mot_bookings', 'ix_mot_bookings_tenant_date'):
        op.drop_index('ix_mot_bookings_tenant_date', table_name='mot_bookings')
    if index_exists('mot_bookings', 'ix_mot_bookings_tenant_id'):
        op.drop_index('ix_mot_bookings_tenant_id', table_name='mot_bookings')
    if table_exists('mot_bookings'):
        op.drop_table('mot_bookings')

    if index_exists('mot_retailers', 'ix_mot_retailers_id'):
        op.drop_index(op.f('ix_mot_retailers_id'), table_name='mot_retailers')
    if index_exists('mot_retailers', 'ix_mot_retailers_tenant_default'):
        op.drop_index('ix_mot_retailers_tenant_default', table_name='mot_retailers')
    if index_exists('mot_retailers', 'ix_mot_retailers_tenant_id'):
        op.drop_index('ix_mot_retailers_tenant_id', table_name='mot_retailers')
    if table_exists('mot_retailers'):
        op.drop_table('mot_retailers')
