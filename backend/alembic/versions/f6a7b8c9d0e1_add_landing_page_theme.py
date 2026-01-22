"""add_landing_page_theme

Revision ID: f6a7b8c9d0e1
Revises: e4f5a6b7c8d9
Create Date: 2026-01-22 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = "f6a7b8c9d0e1"
down_revision = "e4f5a6b7c8d9"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "landing_pages",
        sa.Column(
            "theme",
            sqlmodel.sql.sqltypes.AutoString(),
            server_default="light",
            nullable=False,
        ),
    )


def downgrade():
    op.drop_column("landing_pages", "theme")
