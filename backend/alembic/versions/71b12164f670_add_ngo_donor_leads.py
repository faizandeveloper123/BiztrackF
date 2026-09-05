"""add_ngo_donor_leads

Revision ID: 71b12164f670
Revises: a04b0737ff5c
Create Date: 2026-06-03 23:07:59.574399

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '71b12164f670'
down_revision: Union[str, None] = 'a04b0737ff5c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ngo_donor_leads',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('organization', sa.String(length=255), nullable=True),
        sa.Column('expected_donation', sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('source', sa.String(length=32), nullable=False),
        sa.Column('assigned_to', sa.String(length=255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('createdAt', sa.DateTime(), nullable=True),
        sa.Column('updatedAt', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_ngo_donor_leads_tenant_id', 'ngo_donor_leads', ['tenant_id'], unique=False)
    op.create_index(
        'ix_ngo_donor_leads_tenant_status',
        'ngo_donor_leads',
        ['tenant_id', 'status'],
        unique=False,
    )
    op.create_index(op.f('ix_ngo_donor_leads_id'), 'ngo_donor_leads', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ngo_donor_leads_id'), table_name='ngo_donor_leads')
    op.drop_index('ix_ngo_donor_leads_tenant_status', table_name='ngo_donor_leads')
    op.drop_index('ix_ngo_donor_leads_tenant_id', table_name='ngo_donor_leads')
    op.drop_table('ngo_donor_leads')
