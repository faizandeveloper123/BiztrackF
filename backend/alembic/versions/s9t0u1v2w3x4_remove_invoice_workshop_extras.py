"""remove invoice workshop extras documentNo labour parts descriptions

Revision ID: s9t0u1v2w3x4
Revises: r8s9t0u1v2w3
Create Date: 2026-08-04 16:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import column_exists, safe_drop_column


revision: str = "s9t0u1v2w3x4"
down_revision: Union[str, None] = "r8s9t0u1v2w3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


DROP_COLUMNS = [
    "documentNo",
    "jobDescription",
    "partsDescription",
    "labourTotal",
    "partsTotal",
]


def upgrade() -> None:
    for column_name in DROP_COLUMNS:
        if column_exists("invoices", column_name):
            safe_drop_column("invoices", column_name)


def downgrade() -> None:
    if not column_exists("invoices", "documentNo"):
        op.add_column("invoices", sa.Column("documentNo", sa.String(), nullable=True))
    if not column_exists("invoices", "jobDescription"):
        op.add_column("invoices", sa.Column("jobDescription", sa.Text(), nullable=True))
    if not column_exists("invoices", "partsDescription"):
        op.add_column("invoices", sa.Column("partsDescription", sa.Text(), nullable=True))
    if not column_exists("invoices", "labourTotal"):
        op.add_column("invoices", sa.Column("labourTotal", sa.Float(), nullable=True, server_default="0"))
    if not column_exists("invoices", "partsTotal"):
        op.add_column("invoices", sa.Column("partsTotal", sa.Float(), nullable=True, server_default="0"))
