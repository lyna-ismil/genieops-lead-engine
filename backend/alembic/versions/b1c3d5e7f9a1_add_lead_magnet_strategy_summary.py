"""Add lead magnet strategy_summary

Revision ID: b1c3d5e7f9a1
Revises: f6a7b8c9d0e1
Create Date: 2026-01-22
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b1c3d5e7f9a1"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("lead_magnets", sa.Column("strategy_summary", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("lead_magnets", "strategy_summary")
