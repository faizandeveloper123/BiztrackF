"""add_product_catalog_fields

Revision ID: c8d9e0f1a2b3
Revises: b2c3d4e5f6a7
Create Date: 2026-06-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'c8d9e0f1a2b3'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('products', sa.Column('productType', sa.String(), nullable=True))
    op.add_column('products', sa.Column('packSize', sa.Integer(), server_default='1', nullable=True))
    op.add_column(
        'products',
        sa.Column('supplierId', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        'fk_products_supplier_id',
        'products',
        'suppliers',
        ['supplierId'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_products_supplier_id', 'products', type_='foreignkey')
    op.drop_column('products', 'supplierId')
    op.drop_column('products', 'packSize')
    op.drop_column('products', 'productType')
