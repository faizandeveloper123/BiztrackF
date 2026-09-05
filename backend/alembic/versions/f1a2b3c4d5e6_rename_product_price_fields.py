"""rename product price fields (costPrice->costPerUnitPrice, unitPrice->salePrice)

Revision ID: f1a2b3c4d5e6
Revises: e4f5a6b7c8d9
Create Date: 2026-08-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils import table_exists, column_exists

revision: str = "f1a2b3c4d5e6"
down_revision: Union[str, None] = "e4f5a6b7c8d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _rename_column_if_possible(table_name: str, old_name: str, new_name: str) -> None:
    if column_exists(table_name, old_name) and not column_exists(table_name, new_name):
        op.alter_column(table_name, old_name, new_column_name=new_name)


def _migrate_invoice_items_json(old_key: str, new_key: str) -> None:
    if not (table_exists("invoices") and column_exists("invoices", "items")):
        return
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    op.execute(
        sa.text(
            f"""
            UPDATE invoices
            SET items = (
                SELECT COALESCE(
                    jsonb_agg(
                        CASE
                            WHEN value ? :old_key AND NOT value ? :new_key
                                THEN (jsonb_set(value, '{{{new_key}}}', value -> :old_key)) - :old_key
                            ELSE value
                        END
                    ),
                    '[]'::jsonb
                )
                FROM jsonb_array_elements(items::jsonb) AS value
            )
            WHERE jsonb_typeof(items::jsonb) = 'array'
            """
        ).bindparams(old_key=old_key, new_key=new_key)
    )


def upgrade() -> None:
    if table_exists("products"):
        _rename_column_if_possible("products", "costPrice", "costPerUnitPrice")
        _rename_column_if_possible("products", "unitPrice", "salePrice")
    _migrate_invoice_items_json("unitPrice", "salePrice")


def downgrade() -> None:
    if table_exists("products"):
        _rename_column_if_possible("products", "costPerUnitPrice", "costPrice")
        _rename_column_if_possible("products", "salePrice", "unitPrice")
    _migrate_invoice_items_json("salePrice", "unitPrice")
