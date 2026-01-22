"""add_user_password_hash

Revision ID: b9c0d1e2f3a4
Revises: f6a7b8c9d0e1
Create Date: 2026-01-22 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b9c0d1e2f3a4"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column("hashed_password", sa.String(), nullable=False, server_default=""),
    )


def downgrade():
    op.drop_column("users", "hashed_password")
