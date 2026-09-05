"""add vehicle engine_number and remove vehicle customer_id

Revision ID: t0u1v2w3x4y5
Revises: s9t0u1v2w3x4
Create Date: 2026-08-05 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_utils import (
    column_exists,
    safe_drop_column,
)


revision: str = "t0u1v2w3x4y5"
down_revision: Union[str, None] = "s9t0u1v2w3x4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _drop_vehicle_customer_fk() -> None:
    insp = sa.inspect(op.get_bind())
    if not insp.has_table("vehicles"):
        return
    for fk in insp.get_foreign_keys("vehicles"):
        if "customer_id" in fk.get("constrained_columns", []) and fk.get("name"):
            op.drop_constraint(fk["name"], "vehicles", type_="foreignkey")


def _recreate_vehicle_customer_fk() -> None:
    op.create_foreign_key(
        "vehicles_customer_id_fkey",
        "vehicles",
        "customers",
        ["customer_id"],
        ["id"],
    )


def upgrade() -> None:
    if not column_exists("vehicles", "engine_number"):
        op.add_column("vehicles", sa.Column("engine_number", sa.String(), nullable=True))

    if column_exists("vehicles", "customer_id"):
        _drop_vehicle_customer_fk()
        safe_drop_column("vehicles", "customer_id")


def downgrade() -> None:
    if not column_exists("vehicles", "customer_id"):
        op.add_column(
            "vehicles",
            sa.Column("customer_id", postgresql.UUID(as_uuid=True), nullable=True),
        )
        _recreate_vehicle_customer_fk()

    if column_exists("vehicles", "engine_number"):
        safe_drop_column("vehicles", "engine_number")
