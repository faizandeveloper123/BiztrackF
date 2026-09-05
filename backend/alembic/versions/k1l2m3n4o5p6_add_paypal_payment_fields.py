"""add_paypal_payment_fields

Revision ID: k1l2m3n4o5p6
Revises: j0k1l2m3n4o5
Create Date: 2026-07-10 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "k1l2m3n4o5p6"
down_revision: Union[str, None] = "j0k1l2m3n4o5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("plans", sa.Column("paypal_plan_id", sa.String(), nullable=True))
    op.add_column("subscriptions", sa.Column("payment_provider", sa.String(), nullable=True))
    op.add_column("subscriptions", sa.Column("paypal_subscription_id", sa.String(), nullable=True))
    op.create_index("ix_subscriptions_paypal_subscription_id", "subscriptions", ["paypal_subscription_id"])
    op.create_index("ix_subscriptions_payment_provider", "subscriptions", ["payment_provider"])


def downgrade() -> None:
    op.drop_index("ix_subscriptions_payment_provider", table_name="subscriptions")
    op.drop_index("ix_subscriptions_paypal_subscription_id", table_name="subscriptions")
    op.drop_column("subscriptions", "paypal_subscription_id")
    op.drop_column("subscriptions", "payment_provider")
    op.drop_column("plans", "paypal_plan_id")
