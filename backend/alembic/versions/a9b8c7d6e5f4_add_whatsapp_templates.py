"""add whatsapp templates

Revision ID: a9b8c7d6e5f4
Revises: x9y8z7w6v5u4
Create Date: 2026-09-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_utils import table_exists


revision: str = 'a9b8c7d6e5f4'
down_revision: Union[str, None] = 'x9y8z7w6v5u4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    if table_exists('whatsapp_templates'):
        return

    op.create_table(
        'whatsapp_templates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('template_type', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tenant_id', 'template_type', name='uq_whatsapp_template_tenant_type'),
    )
    op.create_index('ix_whatsapp_templates_tenant_type', 'whatsapp_templates', ['tenant_id', 'template_type'])
    op.create_index('ix_whatsapp_templates_tenant_id', 'whatsapp_templates', ['tenant_id'])


def downgrade() -> None:
    if table_exists('whatsapp_templates'):
        op.drop_index('ix_whatsapp_templates_tenant_type', table_name='whatsapp_templates')
        op.drop_index('ix_whatsapp_templates_tenant_id', table_name='whatsapp_templates')
        op.drop_table('whatsapp_templates')