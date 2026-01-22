"""add_strategy_summary_to_campaigns

Revision ID: 2f4a1b2c3d45
Revises: d994738412fa
Create Date: 2026-01-22 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2f4a1b2c3d45'
down_revision = 'd994738412fa'
branch_labels = None
depends_on = None


def upgrade():
    # add strategy_summary JSON column to campaigns
    op.add_column('campaigns', sa.Column('strategy_summary', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('campaigns', 'strategy_summary')
