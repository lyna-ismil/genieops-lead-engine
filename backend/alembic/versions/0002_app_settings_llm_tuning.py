"""add llm tuning fields to app_settings

Revision ID: 0002_app_settings_llm_tuning
Revises: 0001_initial
Create Date: 2026-01-18 00:00:00
"""
from alembic import op
import sqlalchemy as sa


revision = "0002_app_settings_llm_tuning"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("app_settings", sa.Column("llm_model", sa.String(), nullable=True))
    op.add_column("app_settings", sa.Column("llm_temperature", sa.Float(), nullable=True))
    op.add_column("app_settings", sa.Column("llm_max_tokens", sa.Integer(), nullable=True))


def downgrade():
    op.drop_column("app_settings", "llm_max_tokens")
    op.drop_column("app_settings", "llm_temperature")
    op.drop_column("app_settings", "llm_model")
