"""remove production planning and equipment maintenance

Revision ID: p6q7r8s9t0u1
Revises: o5p6q7r8s9t0
Create Date: 2026-08-04 11:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import (
    column_exists,
    safe_drop_column,
    safe_drop_constraint,
    safe_drop_index,
    table_exists,
)


revision: str = "p6q7r8s9t0u1"
down_revision: Union[str, None] = "o5p6q7r8s9t0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


QC_TABLES = ["quality_checks", "quality_defects"]

PRODUCTION_TABLES = [
    "production_schedules",
    "production_steps",
    "production_plans",
]

MAINTENANCE_TABLES = [
    "maintenance_reports",
    "maintenance_work_orders",
    "maintenance_schedules",
    "equipment",
]


def _drop_fks_to_table(table_name: str, referred_table: str) -> None:
    if not table_exists(table_name):
        return
    insp = sa.inspect(op.get_bind())
    for fk in insp.get_foreign_keys(table_name):
        if fk.get("referred_table") == referred_table:
            name = fk.get("name")
            if name:
                safe_drop_constraint(name, table_name)


def _drop_column_indexes(table_name: str, column_name: str) -> None:
    if not table_exists(table_name):
        return
    insp = sa.inspect(op.get_bind())
    for index in insp.get_indexes(table_name):
        cols = index.get("column_names") or []
        name = index.get("name")
        if name and column_name in cols:
            safe_drop_index(name, table_name)


def upgrade() -> None:
    for table_name in QC_TABLES:
        _drop_fks_to_table(table_name, "production_plans")
        _drop_column_indexes(table_name, "production_plan_id")
        safe_drop_column(table_name, "production_plan_id")

    for table_name in PRODUCTION_TABLES:
        if table_exists(table_name):
            op.drop_table(table_name)

    for table_name in MAINTENANCE_TABLES:
        if table_exists(table_name):
            op.drop_table(table_name)

    for enum_name in (
        "productionstatus",
        "productionpriority",
        "productiontype",
        "production_status",
        "production_priority",
        "production_type",
        "maintenancestatus",
        "maintenancepriority",
        "maintenancetype",
        "equipmentstatus",
        "maintenancecategory",
        "maintenance_status",
        "maintenance_priority",
        "maintenance_type",
        "equipment_status",
        "maintenance_category",
    ):
        op.execute(sa.text(f"DROP TYPE IF EXISTS {enum_name}"))


def downgrade() -> None:
    pass
