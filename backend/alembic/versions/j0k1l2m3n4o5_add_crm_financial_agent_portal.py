"""add_crm_financial_agent_portal

Revision ID: j0k1l2m3n4o5
Revises: i9j0k1l2m3n4
Create Date: 2026-07-09 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'j0k1l2m3n4o5'
down_revision: Union[str, None] = 'i9j0k1l2m3n4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('contacts', sa.Column('clientValue', sa.Float(), nullable=True))
    op.add_column('contacts', sa.Column('lastContactDate', sa.DateTime(), nullable=True))
    op.add_column('invoices', sa.Column('contactId', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'fk_invoices_contact_id',
        'invoices',
        'contacts',
        ['contactId'],
        ['id'],
    )
    op.create_index('idx_invoices_contact_id', 'invoices', ['contactId'])

    op.create_table(
        'agent_sales_targets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('userId', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('targetAmount', sa.Float(), nullable=False, server_default='0'),
        sa.Column('createdAt', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updatedAt', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_index('idx_agent_sales_targets_tenant_user', 'agent_sales_targets', ['tenant_id', 'userId'])

    op.create_table(
        'agent_earned_badges',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('userId', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('badgeKey', sa.String(), nullable=False),
        sa.Column('earnedAt', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_index('idx_agent_earned_badges_user', 'agent_earned_badges', ['tenant_id', 'userId', 'badgeKey'], unique=True)

    op.create_table(
        'client_payment_ledger',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False),
        sa.Column('contactId', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id'), nullable=True),
        sa.Column('opportunityId', postgresql.UUID(as_uuid=True), sa.ForeignKey('opportunities.id'), nullable=True),
        sa.Column('invoiceId', postgresql.UUID(as_uuid=True), sa.ForeignKey('invoices.id'), nullable=True),
        sa.Column('paymentId', postgresql.UUID(as_uuid=True), sa.ForeignKey('payments.id'), nullable=True),
        sa.Column('installmentId', postgresql.UUID(as_uuid=True), sa.ForeignKey('installments.id'), nullable=True),
        sa.Column('assignedToId', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('entryType', sa.String(), nullable=False),
        sa.Column('revenueType', sa.String(), nullable=False, server_default='realized'),
        sa.Column('amount', sa.Float(), nullable=False, server_default='0'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('entryDate', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('createdAt', sa.DateTime(), server_default=sa.text('now()')),
    )
    op.create_index('idx_client_payment_ledger_tenant_contact', 'client_payment_ledger', ['tenant_id', 'contactId'])
    op.create_index('idx_client_payment_ledger_tenant_agent', 'client_payment_ledger', ['tenant_id', 'assignedToId'])
    op.create_index('idx_client_payment_ledger_entry_date', 'client_payment_ledger', ['entryDate'])


def downgrade() -> None:
    op.drop_index('idx_client_payment_ledger_entry_date', 'client_payment_ledger')
    op.drop_index('idx_client_payment_ledger_tenant_agent', 'client_payment_ledger')
    op.drop_index('idx_client_payment_ledger_tenant_contact', 'client_payment_ledger')
    op.drop_table('client_payment_ledger')
    op.drop_index('idx_agent_earned_badges_user', 'agent_earned_badges')
    op.drop_table('agent_earned_badges')
    op.drop_index('idx_agent_sales_targets_tenant_user', 'agent_sales_targets')
    op.drop_table('agent_sales_targets')
    op.drop_index('idx_invoices_contact_id', 'invoices')
    op.drop_constraint('fk_invoices_contact_id', 'invoices', type_='foreignkey')
    op.drop_column('invoices', 'contactId')
    op.drop_column('contacts', 'lastContactDate')
    op.drop_column('contacts', 'clientValue')
