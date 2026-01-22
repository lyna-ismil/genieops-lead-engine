"""add_landing_page_background_style

Revision ID: e4f5a6b7c8d9
Revises: c1d2e3f4a5b6
Create Date: 2026-01-22 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = "e4f5a6b7c8d9"
down_revision = "c1d2e3f4a5b6"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "landing_pages",
        sa.Column(
            "background_style",
            sqlmodel.sql.sqltypes.AutoString(),
            server_default="plain_white",
            nullable=False,
        ),
    )


def downgrade():
    op.drop_column("landing_pages", "background_style")
