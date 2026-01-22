"""add_campaign_product_context

Revision ID: f3b2a9c7d8e1
Revises: ddef133af530
Create Date: 2026-01-21 00:32:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "f3b2a9c7d8e1"
down_revision = "ddef133af530"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("campaigns", sa.Column("product_context", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("campaigns", "product_context")