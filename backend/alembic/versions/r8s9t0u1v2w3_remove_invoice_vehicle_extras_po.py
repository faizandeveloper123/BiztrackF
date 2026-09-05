"""remove invoice vehicle extras and purchaseOrderId

Revision ID: r8s9t0u1v2w3
Revises: q7r8s9t0u1v2
Create Date: 2026-08-04 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_utils import (
    column_exists,
    safe_drop_column,
    safe_drop_constraint,
)


revision: str = "r8s9t0u1v2w3"
down_revision: Union[str, None] = "q7r8s9t0u1v2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


VEHICLE_EXTRA_COLUMNS = [
    "vehicleMake",
    "vehicleModel",
    "vehicleYear",
    "vehicleColor",
    "vehicleVin",
    "vehicleMileage",
]


def upgrade() -> None:
    if column_exists("invoices", "purchaseOrderId"):
        safe_drop_constraint("fk_invoices_purchase_order_id", "invoices", "foreignkey")
        safe_drop_column("invoices", "purchaseOrderId")

    for column_name in VEHICLE_EXTRA_COLUMNS:
        if column_exists("invoices", column_name):
            safe_drop_column("invoices", column_name)


def downgrade() -> None:
    for column_name in VEHICLE_EXTRA_COLUMNS:
        if not column_exists("invoices", column_name):
            op.add_column(
                "invoices",
                sa.Column(column_name, sa.String(), nullable=True),
            )

    if not column_exists("invoices", "purchaseOrderId"):
        op.add_column(
            "invoices",
            sa.Column("purchaseOrderId", postgresql.UUID(as_uuid=True), nullable=True),
        )
        op.create_foreign_key(
            "fk_invoices_purchase_order_id",
            "invoices",
            "purchase_orders",
            ["purchaseOrderId"],
            ["id"],
        )
