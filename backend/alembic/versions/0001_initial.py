"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-01-18 00:00:00
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "campaigns",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("icp_role", sa.String(), nullable=False),
        sa.Column("icp_industry", sa.String(), nullable=False),
        sa.Column("icp_company_size", sa.String(), nullable=True),
        sa.Column("icp_pain_points", sa.JSON(), nullable=True),
        sa.Column("icp_goals", sa.JSON(), nullable=True),
        sa.Column("offer_type", sa.String(), nullable=True),
        sa.Column("brand_voice", sa.String(), nullable=True),
        sa.Column("target_conversion", sa.Float(), nullable=True),
        sa.Column("linked_in_post", sa.Text(), nullable=True),
        sa.Column("upgrade_offer", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_campaigns_status", "campaigns", ["status"], unique=False)

    op.create_table(
        "lead_magnets",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("campaign_id", sa.String(), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("pain_point_alignment", sa.String(), nullable=False),
        sa.Column("value_promise", sa.String(), nullable=False),
        sa.Column("conversion_score", sa.Float(), nullable=False),
        sa.Column("format_recommendation", sa.String(), nullable=False),
        sa.Column("is_selected", sa.Boolean(), nullable=False),
        sa.Column("idea_payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_lead_magnets_campaign_id", "lead_magnets", ["campaign_id"], unique=False)

    op.create_table(
        "assets",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("lead_magnet_id", sa.String(), sa.ForeignKey("lead_magnets.id"), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("content_text", sa.Text(), nullable=True),
        sa.Column("content_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_assets_lead_magnet_id", "assets", ["lead_magnet_id"], unique=False)

    op.create_table(
        "landing_pages",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("lead_magnet_id", sa.String(), sa.ForeignKey("lead_magnets.id"), nullable=False),
        sa.Column("slug", sa.String(), nullable=False),
        sa.Column("headline", sa.String(), nullable=False),
        sa.Column("subheadline", sa.String(), nullable=False),
        sa.Column("bullets", sa.JSON(), nullable=True),
        sa.Column("cta", sa.String(), nullable=False),
        sa.Column("html_content", sa.Text(), nullable=False),
        sa.Column("sections", sa.JSON(), nullable=True),
        sa.Column("form_schema", sa.JSON(), nullable=True),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_landing_pages_slug", "landing_pages", ["slug"], unique=True)
    op.create_index("ix_landing_pages_lead_magnet_id", "landing_pages", ["lead_magnet_id"], unique=False)

    op.create_table(
        "nurture_sequences",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("campaign_id", sa.String(), sa.ForeignKey("campaigns.id"), nullable=False),
        sa.Column("lead_magnet_id", sa.String(), sa.ForeignKey("lead_magnets.id"), nullable=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_nurture_sequences_campaign_id", "nurture_sequences", ["campaign_id"], unique=False)

    op.create_table(
        "nurture_steps",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("sequence_id", sa.String(), sa.ForeignKey("nurture_sequences.id"), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("offset_days", sa.Integer(), nullable=False),
        sa.Column("intent", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_nurture_steps_sequence_id", "nurture_steps", ["sequence_id"], unique=False)

    op.create_table(
        "leads",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("campaign_id", sa.String(), sa.ForeignKey("campaigns.id"), nullable=True),
        sa.Column("lead_magnet_id", sa.String(), sa.ForeignKey("lead_magnets.id"), nullable=True),
        sa.Column("landing_page_id", sa.String(), sa.ForeignKey("landing_pages.id"), nullable=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_leads_email", "leads", ["email"], unique=False)

    op.create_table(
        "email_logs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("lead_id", sa.String(), sa.ForeignKey("leads.id"), nullable=False),
        sa.Column("sequence_id", sa.String(), sa.ForeignKey("nurture_sequences.id"), nullable=True),
        sa.Column("step_id", sa.String(), sa.ForeignKey("nurture_steps.id"), nullable=True),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_email_logs_lead_id", "email_logs", ["lead_id"], unique=False)

    op.create_table(
        "email_templates",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("subject", sa.String(), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "app_settings",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("llm_provider", sa.String(), nullable=False),
        sa.Column("llm_api_key", sa.String(), nullable=True),
        sa.Column("email_provider", sa.String(), nullable=False),
        sa.Column("email_api_key", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("app_settings")
    op.drop_table("email_templates")
    op.drop_table("email_logs")
    op.drop_table("leads")
    op.drop_table("nurture_steps")
    op.drop_table("nurture_sequences")
    op.drop_table("landing_pages")
    op.drop_table("assets")
    op.drop_table("lead_magnets")
    op.drop_table("campaigns")
    op.drop_table("users")
