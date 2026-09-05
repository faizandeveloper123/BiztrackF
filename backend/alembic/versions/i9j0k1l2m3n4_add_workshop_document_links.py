"""add_workshop_document_links

Revision ID: i9j0k1l2m3n4
Revises: h8i9j0k1l2m3
Create Date: 2026-07-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'i9j0k1l2m3n4'
down_revision: Union[str, None] = 'h8i9j0k1l2m3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('purchase_orders', sa.Column('purchaseForType', sa.String(), nullable=True))
    op.add_column('purchase_orders', sa.Column('vehicleId', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('purchase_orders', sa.Column('jobCardId', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('purchase_orders', sa.Column('invoiceId', postgresql.UUID(as_uuid=True), nullable=True))

    op.add_column('job_cards', sa.Column('purchase_order_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('job_cards', sa.Column('invoice_id', postgresql.UUID(as_uuid=True), nullable=True))

    op.add_column('invoices', sa.Column('purchaseOrderId', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('invoices', sa.Column('jobCardId', postgresql.UUID(as_uuid=True), nullable=True))

    op.create_foreign_key('fk_purchase_orders_vehicle_id', 'purchase_orders', 'vehicles', ['vehicleId'], ['id'])
    op.create_foreign_key('fk_purchase_orders_job_card_id', 'purchase_orders', 'job_cards', ['jobCardId'], ['id'])
    op.create_foreign_key('fk_purchase_orders_invoice_id', 'purchase_orders', 'invoices', ['invoiceId'], ['id'])
    op.create_foreign_key('fk_job_cards_purchase_order_id', 'job_cards', 'purchase_orders', ['purchase_order_id'], ['id'])
    op.create_foreign_key('fk_job_cards_invoice_id', 'job_cards', 'invoices', ['invoice_id'], ['id'])
    op.create_foreign_key('fk_invoices_purchase_order_id', 'invoices', 'purchase_orders', ['purchaseOrderId'], ['id'])
    op.create_foreign_key('fk_invoices_job_card_id', 'invoices', 'job_cards', ['jobCardId'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_invoices_job_card_id', 'invoices', type_='foreignkey')
    op.drop_constraint('fk_invoices_purchase_order_id', 'invoices', type_='foreignkey')
    op.drop_column('invoices', 'jobCardId')
    op.drop_column('invoices', 'purchaseOrderId')

    op.drop_constraint('fk_job_cards_invoice_id', 'job_cards', type_='foreignkey')
    op.drop_constraint('fk_job_cards_purchase_order_id', 'job_cards', type_='foreignkey')
    op.drop_column('job_cards', 'invoice_id')
    op.drop_column('job_cards', 'purchase_order_id')

    op.drop_constraint('fk_purchase_orders_invoice_id', 'purchase_orders', type_='foreignkey')
    op.drop_constraint('fk_purchase_orders_job_card_id', 'purchase_orders', type_='foreignkey')
    op.drop_constraint('fk_purchase_orders_vehicle_id', 'purchase_orders', type_='foreignkey')
    op.drop_column('purchase_orders', 'invoiceId')
    op.drop_column('purchase_orders', 'jobCardId')
    op.drop_column('purchase_orders', 'vehicleId')
    op.drop_column('purchase_orders', 'purchaseForType')
