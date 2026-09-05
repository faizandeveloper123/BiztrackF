"""remove workshop work orders

Revision ID: o5p6q7r8s9t0
Revises: n4o5p6q7r8s9
Create Date: 2026-08-04 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_utils import (
    column_exists,
    safe_drop_column,
    safe_drop_constraint,
    safe_drop_index,
    table_exists,
)


revision: str = "o5p6q7r8s9t0"
down_revision: Union[str, None] = "n4o5p6q7r8s9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


FK_TABLES = [
    "job_cards",
    "production_plans",
    "quality_checks",
    "quality_defects",
]


def _drop_work_order_fks(table_name: str) -> None:
    if not table_exists(table_name):
        return
    bind = op.get_bind()
    insp = sa.inspect(bind)
    for fk in insp.get_foreign_keys(table_name):
        referred = fk.get("referred_table")
        constrained = fk.get("constrained_columns") or []
        if referred == "work_orders" or "work_order_id" in constrained:
            name = fk.get("name")
            if name:
                safe_drop_constraint(name, table_name)


def _drop_work_order_indexes(table_name: str) -> None:
    if not table_exists(table_name):
        return
    bind = op.get_bind()
    insp = sa.inspect(bind)
    for index in insp.get_indexes(table_name):
        cols = index.get("column_names") or []
        name = index.get("name")
        if name and "work_order_id" in cols:
            safe_drop_index(name, table_name)


def upgrade() -> None:
    for table_name in FK_TABLES:
        _drop_work_order_fks(table_name)
        _drop_work_order_indexes(table_name)
        safe_drop_column(table_name, "work_order_id")

    if table_exists("work_order_tasks"):
        op.drop_table("work_order_tasks")

    if table_exists("work_orders"):
        op.drop_table("work_orders")

    for enum_name in (
        "workorderstatus",
        "workorderpriority",
        "workordertype",
        "work_order_status",
        "work_order_priority",
        "work_order_type",
    ):
        op.execute(sa.text(f"DROP TYPE IF EXISTS {enum_name}"))


def downgrade() -> None:
    if not table_exists("work_orders"):
        workorderstatus = postgresql.ENUM(
            "draft", "planned", "in_progress", "on_hold", "completed", "cancelled",
            name="workorderstatus",
            create_type=False,
        )
        workorderpriority = postgresql.ENUM(
            "low", "medium", "high", "urgent",
            name="workorderpriority",
            create_type=False,
        )
        workordertype = postgresql.ENUM(
            "production", "maintenance", "repair", "installation", "inspection",
            name="workordertype",
            create_type=False,
        )
        workorderstatus.create(op.get_bind(), checkfirst=True)
        workorderpriority.create(op.get_bind(), checkfirst=True)
        workordertype.create(op.get_bind(), checkfirst=True)

        op.create_table(
            "work_orders",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
            sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=True),
            sa.Column("work_order_number", sa.String(), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("description", sa.Text()),
            sa.Column("work_order_type", workordertype, nullable=False),
            sa.Column("status", workorderstatus, nullable=False),
            sa.Column("priority", workorderpriority, nullable=False),
            sa.Column("planned_start_date", sa.DateTime()),
            sa.Column("planned_end_date", sa.DateTime()),
            sa.Column("actual_start_date", sa.DateTime()),
            sa.Column("actual_end_date", sa.DateTime()),
            sa.Column("estimated_hours", sa.Float(), server_default="0"),
            sa.Column("actual_hours", sa.Float(), server_default="0"),
            sa.Column("assigned_to_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("created_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("approved_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("equipment_id", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("location", sa.String()),
            sa.Column("instructions", sa.Text()),
            sa.Column("safety_notes", sa.Text()),
            sa.Column("quality_requirements", sa.Text()),
            sa.Column("materials_required", sa.JSON()),
            sa.Column("estimated_cost", sa.Float(), server_default="0"),
            sa.Column("actual_cost", sa.Float(), server_default="0"),
            sa.Column("completion_percentage", sa.Float(), server_default="0"),
            sa.Column("current_step", sa.String()),
            sa.Column("notes", sa.JSON()),
            sa.Column("tags", sa.JSON()),
            sa.Column("attachments", sa.JSON()),
            sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime()),
            sa.Column("updated_at", sa.DateTime()),
        )

    if not table_exists("work_order_tasks"):
        op.create_table(
            "work_order_tasks",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("work_order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("work_orders.id"), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("description", sa.Text()),
            sa.Column("sequence_number", sa.Integer(), server_default="0"),
            sa.Column("estimated_hours", sa.Float(), server_default="0"),
            sa.Column("actual_hours", sa.Float(), server_default="0"),
            sa.Column("status", sa.String(), server_default="pending"),
            sa.Column("completion_percentage", sa.Float(), server_default="0"),
            sa.Column("assigned_to_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
            sa.Column("started_at", sa.DateTime()),
            sa.Column("completed_at", sa.DateTime()),
            sa.Column("notes", sa.Text()),
            sa.Column("attachments", sa.JSON()),
            sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
            sa.Column("created_at", sa.DateTime()),
            sa.Column("updated_at", sa.DateTime()),
        )

    for table_name in FK_TABLES:
        if table_exists(table_name) and not column_exists(table_name, "work_order_id"):
            op.add_column(
                table_name,
                sa.Column("work_order_id", postgresql.UUID(as_uuid=True), nullable=True),
            )
            op.create_foreign_key(
                f"{table_name}_work_order_id_fkey",
                table_name,
                "work_orders",
                ["work_order_id"],
                ["id"],
            )
