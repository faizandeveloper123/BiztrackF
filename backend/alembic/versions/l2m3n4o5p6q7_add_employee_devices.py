"""add_employee_devices

Revision ID: l2m3n4o5p6q7
Revises: k1l2m3n4o5p6
Create Date: 2026-07-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "l2m3n4o5p6q7"
down_revision: Union[str, None] = "k1l2m3n4o5p6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "employee_devices",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("employeeId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("devicetype", sa.String(), nullable=True),
        sa.Column("serialnumber", sa.String(), nullable=True),
        sa.Column("model", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("assignedAt", sa.DateTime(), nullable=True),
        sa.Column("returnedAt", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("assignedby", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("createdAt", sa.DateTime(), nullable=True),
        sa.Column("updatedAt", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["assignedby"], ["users.id"]),
        sa.ForeignKeyConstraint(["employeeId"], ["employees.id"]),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_employee_devices_tenant", "employee_devices", ["tenant_id"])
    op.create_index("idx_employee_devices_employee", "employee_devices", ["employeeId"])


def downgrade() -> None:
    op.drop_index("idx_employee_devices_employee", table_name="employee_devices")
    op.drop_index("idx_employee_devices_tenant", table_name="employee_devices")
    op.drop_table("employee_devices")
