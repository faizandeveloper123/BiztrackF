"""extend_leads_crm_revamp

Revision ID: n4o5p6q7r8s9
Revises: m3n4o5p6q7r8
Create Date: 2026-07-30 16:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from migration_utils import table_exists, column_exists, safe_create_index

revision: str = "n4o5p6q7r8s9"
down_revision: Union[str, None] = "m3n4o5p6q7r8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


LEAD_COLUMNS = [
    ("pipelineStage", sa.String(), "new_lead"),
    ("leadRating", sa.String(), None),
    ("leadType", sa.String(), None),
    ("priceMin", sa.Float(), None),
    ("priceMax", sa.Float(), None),
    ("buyIntent", sa.String(), None),
    ("sellIntent", sa.String(), None),
    ("houseToSell", sa.String(), None),
    ("buyingIn", sa.String(), None),
    ("sellingIn", sa.String(), None),
    ("mortgageType", sa.String(), None),
    ("ownsRents", sa.String(), None),
    ("workPhone", sa.String(), None),
    ("homePhone", sa.String(), None),
    ("address", sa.Text(), None),
    ("city", sa.String(), None),
    ("description", sa.Text(), None),
    ("ipAddress", sa.String(), None),
    ("lat", sa.Float(), None),
    ("lng", sa.Float(), None),
    ("mainAgentId", postgresql.UUID(as_uuid=True), None),
    ("listAgentId", postgresql.UUID(as_uuid=True), None),
    ("mortgageAgentId", postgresql.UUID(as_uuid=True), None),
    ("score", sa.Integer(), 0),
    ("budget", sa.Float(), None),
    ("timeline", sa.String(), None),
    ("estimatedValue", sa.Float(), None),
    ("expectedCloseDate", sa.DateTime(), None),
    ("lastContactAt", sa.DateTime(), None),
    ("lastContactChannel", sa.String(), None),
    ("registeredAt", sa.DateTime(), None),
    ("isPartial", sa.Boolean(), False),
    ("refSource", sa.String(), None),
    ("campaignSource", sa.String(), None),
    ("receiveSms", sa.Boolean(), True),
    ("customFields", sa.JSON(), None),
    ("nextFollowUpDate", sa.DateTime(), None),
    ("callCount", sa.Integer(), 0),
    ("emailCount", sa.Integer(), 0),
    ("smsCount", sa.Integer(), 0),
    ("lastCallAt", sa.DateTime(), None),
    ("lastEmailAt", sa.DateTime(), None),
    ("lastSmsAt", sa.DateTime(), None),
    ("hasOpenTask", sa.Boolean(), False),
    ("hasFlaggedTask", sa.Boolean(), False),
]


def upgrade() -> None:
    for name, col_type, server_default in LEAD_COLUMNS:
        if not column_exists("leads", name):
            kwargs = {}
            if server_default is not None:
                if isinstance(server_default, bool):
                    kwargs["server_default"] = sa.text("true" if server_default else "false")
                elif isinstance(server_default, int):
                    kwargs["server_default"] = sa.text(str(server_default))
                else:
                    kwargs["server_default"] = sa.text(f"'{server_default}'")
            op.add_column("leads", sa.Column(name, col_type, **kwargs))

    op.execute(
        """
        UPDATE leads SET "pipelineStage" = CASE
            WHEN status IN ('new') THEN 'new_lead'
            WHEN status IN ('contacted') THEN 'tried_to_contact'
            WHEN status IN ('qualified') THEN 'qualified'
            WHEN status IN ('proposal_sent', 'proposal', 'negotiation') THEN 'made_contact'
            WHEN status IN ('won', 'converted', 'closed') THEN 'closed'
            WHEN status IN ('lost') THEN 'lost'
            ELSE COALESCE("pipelineStage", 'new_lead')
        END
        WHERE "pipelineStage" IS NULL OR "pipelineStage" = 'new_lead'
        """
    )

    if not table_exists("lead_pipeline_history"):
        op.create_table(
            "lead_pipeline_history",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("leadId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("pipelineStage", sa.String(), nullable=False),
            sa.Column("changedAt", sa.DateTime(), nullable=True),
            sa.Column("changedById", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["changedById"], ["users.id"]),
            sa.ForeignKeyConstraint(["leadId"], ["leads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        safe_create_index("ix_lead_pipeline_history_leadId", "lead_pipeline_history", ["leadId"])

    if not table_exists("lead_notes"):
        op.create_table(
            "lead_notes",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("leadId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("commType", sa.String(), nullable=False),
            sa.Column("callResult", sa.String(), nullable=True),
            sa.Column("content", sa.Text(), nullable=True),
            sa.Column("occurredAt", sa.DateTime(), nullable=True),
            sa.Column("createdById", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("isSystem", sa.Boolean(), server_default=sa.text("false")),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.Column("updatedAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["createdById"], ["users.id"]),
            sa.ForeignKeyConstraint(["leadId"], ["leads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        safe_create_index("ix_lead_notes_leadId", "lead_notes", ["leadId"])

    if not table_exists("lead_tasks"):
        op.create_table(
            "lead_tasks",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("leadId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("assignedToId", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("createdById", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("status", sa.String(), server_default="not_started"),
            sa.Column("priority", sa.String(), server_default="normal"),
            sa.Column("dueAt", sa.DateTime(), nullable=True),
            sa.Column("reminder", sa.String(), nullable=True),
            sa.Column("completedAt", sa.DateTime(), nullable=True),
            sa.Column("flagged", sa.Boolean(), server_default=sa.text("false")),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.Column("updatedAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["assignedToId"], ["users.id"]),
            sa.ForeignKeyConstraint(["createdById"], ["users.id"]),
            sa.ForeignKeyConstraint(["leadId"], ["leads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        safe_create_index("ix_lead_tasks_leadId", "lead_tasks", ["leadId"])

    if not table_exists("lead_emails"):
        op.create_table(
            "lead_emails",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("leadId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("subject", sa.String(), nullable=True),
            sa.Column("body", sa.Text(), nullable=True),
            sa.Column("direction", sa.String(), server_default="outgoing"),
            sa.Column("status", sa.String(), server_default="queued"),
            sa.Column("trackingToken", sa.String(), nullable=True),
            sa.Column("toEmail", sa.String(), nullable=True),
            sa.Column("fromEmail", sa.String(), nullable=True),
            sa.Column("createdById", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("sentAt", sa.DateTime(), nullable=True),
            sa.Column("openedAt", sa.DateTime(), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.Column("updatedAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["createdById"], ["users.id"]),
            sa.ForeignKeyConstraint(["leadId"], ["leads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        safe_create_index("ix_lead_emails_leadId", "lead_emails", ["leadId"])
        safe_create_index("ix_lead_emails_trackingToken", "lead_emails", ["trackingToken"])

    if not table_exists("lead_sms"):
        op.create_table(
            "lead_sms",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("leadId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("direction", sa.String(), server_default="outgoing"),
            sa.Column("status", sa.String(), server_default="queued"),
            sa.Column("twilioSid", sa.String(), nullable=True),
            sa.Column("toPhone", sa.String(), nullable=True),
            sa.Column("fromPhone", sa.String(), nullable=True),
            sa.Column("createdById", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("sentAt", sa.DateTime(), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["createdById"], ["users.id"]),
            sa.ForeignKeyConstraint(["leadId"], ["leads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        safe_create_index("ix_lead_sms_leadId", "lead_sms", ["leadId"])

    if not table_exists("lead_campaigns"):
        op.create_table(
            "lead_campaigns",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("steps", sa.JSON(), nullable=True),
            sa.Column("status", sa.String(), server_default="active"),
            sa.Column("createdById", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.Column("updatedAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["createdById"], ["users.id"]),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    if not table_exists("lead_campaign_assignments"):
        op.create_table(
            "lead_campaign_assignments",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("leadId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("campaignId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("status", sa.String(), server_default="in_progress"),
            sa.Column("progress", sa.Integer(), server_default="0"),
            sa.Column("currentStep", sa.Integer(), server_default="0"),
            sa.Column("totalSteps", sa.Integer(), server_default="0"),
            sa.Column("assignedById", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("assignedAt", sa.DateTime(), nullable=True),
            sa.Column("stoppedAt", sa.DateTime(), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.Column("updatedAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["assignedById"], ["users.id"]),
            sa.ForeignKeyConstraint(["campaignId"], ["lead_campaigns.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["leadId"], ["leads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        safe_create_index("ix_lead_campaign_assignments_leadId", "lead_campaign_assignments", ["leadId"])

    if not table_exists("lead_listing_searches"):
        op.create_table(
            "lead_listing_searches",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("leadId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("criteria", sa.JSON(), nullable=True),
            sa.Column("city", sa.String(), nullable=True),
            sa.Column("priceMin", sa.Float(), nullable=True),
            sa.Column("priceMax", sa.Float(), nullable=True),
            sa.Column("propertyTypes", sa.JSON(), nullable=True),
            sa.Column("emailsSent", sa.Integer(), server_default="0"),
            sa.Column("lastSentAt", sa.DateTime(), nullable=True),
            sa.Column("nextSendAt", sa.DateTime(), nullable=True),
            sa.Column("intervalHours", sa.Integer(), server_default="24"),
            sa.Column("active", sa.Boolean(), server_default=sa.text("true")),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.Column("updatedAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["leadId"], ["leads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        safe_create_index("ix_lead_listing_searches_leadId", "lead_listing_searches", ["leadId"])

    if not table_exists("lead_property_views"):
        op.create_table(
            "lead_property_views",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("leadId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("propertyType", sa.String(), nullable=True),
            sa.Column("beds", sa.Integer(), nullable=True),
            sa.Column("baths", sa.Integer(), nullable=True),
            sa.Column("price", sa.Float(), nullable=True),
            sa.Column("city", sa.String(), nullable=True),
            sa.Column("address", sa.String(), nullable=True),
            sa.Column("mlsNumber", sa.String(), nullable=True),
            sa.Column("viewedAt", sa.DateTime(), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["leadId"], ["leads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        safe_create_index("ix_lead_property_views_leadId", "lead_property_views", ["leadId"])

    if not table_exists("lead_sales"):
        op.create_table(
            "lead_sales",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("leadId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("agentRole", sa.String(), nullable=True),
            sa.Column("closingDate", sa.DateTime(), nullable=True),
            sa.Column("mlsNumber", sa.String(), nullable=True),
            sa.Column("sellingPrice", sa.Float(), nullable=True),
            sa.Column("createdById", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.Column("updatedAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["createdById"], ["users.id"]),
            sa.ForeignKeyConstraint(["leadId"], ["leads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        safe_create_index("ix_lead_sales_leadId", "lead_sales", ["leadId"])

    if not table_exists("lead_additional_contacts"):
        op.create_table(
            "lead_additional_contacts",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("leadId", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("name", sa.String(), nullable=True),
            sa.Column("phone", sa.String(), nullable=True),
            sa.Column("email", sa.String(), nullable=True),
            sa.Column("relationshipLabel", sa.String(), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["leadId"], ["leads.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        safe_create_index("ix_lead_additional_contacts_leadId", "lead_additional_contacts", ["leadId"])

    if not table_exists("lead_saved_filters"):
        op.create_table(
            "lead_saved_filters",
            sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
            sa.Column("userId", postgresql.UUID(as_uuid=True), nullable=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("filters", sa.JSON(), nullable=True),
            sa.Column("pinned", sa.Boolean(), server_default=sa.text("false")),
            sa.Column("pinOrder", sa.Integer(), server_default="0"),
            sa.Column("color", sa.String(), nullable=True),
            sa.Column("createdAt", sa.DateTime(), nullable=True),
            sa.Column("updatedAt", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["userId"], ["users.id"]),
            sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"]),
            sa.PrimaryKeyConstraint("id"),
        )


def downgrade() -> None:
    for table in [
        "lead_saved_filters",
        "lead_additional_contacts",
        "lead_sales",
        "lead_property_views",
        "lead_listing_searches",
        "lead_campaign_assignments",
        "lead_campaigns",
        "lead_sms",
        "lead_emails",
        "lead_tasks",
        "lead_notes",
        "lead_pipeline_history",
    ]:
        if table_exists(table):
            op.drop_table(table)
    for name, _, _ in LEAD_COLUMNS:
        if column_exists("leads", name):
            op.drop_column("leads", name)
