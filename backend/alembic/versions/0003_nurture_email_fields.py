"""nurture and email fields

Revision ID: 0003_nurture_email_fields
Revises: 0002_app_settings_llm_tuning
Create Date: 2026-01-18 00:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = "0003_nurture_email_fields"
down_revision = "0002_app_settings_llm_tuning"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("nurture_steps", sa.Column("type", sa.String(), nullable=False, server_default="regular"))
    op.add_column("leads", sa.Column("company", sa.String(), nullable=True))
    op.add_column("email_logs", sa.Column("provider_message_id", sa.String(), nullable=True))
    op.add_column("email_logs", sa.Column("error_message", sa.Text(), nullable=True))
    op.add_column("email_logs", sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("app_settings", sa.Column("email_from", sa.String(), nullable=True))
    op.add_column("app_settings", sa.Column("email_from_name", sa.String(), nullable=True))


def downgrade():
    op.drop_column("app_settings", "email_from_name")
    op.drop_column("app_settings", "email_from")
    op.drop_column("email_logs", "scheduled_at")
    op.drop_column("email_logs", "error_message")
    op.drop_column("email_logs", "provider_message_id")
    op.drop_column("leads", "company")
    op.drop_column("nurture_steps", "type")