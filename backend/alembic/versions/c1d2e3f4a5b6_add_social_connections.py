"""add_social_connections

Revision ID: c1d2e3f4a5b6
Revises: a7c9b1e2f4d0
Create Date: 2026-01-22 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = "c1d2e3f4a5b6"
down_revision = "a7c9b1e2f4d0"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "social_connections",
        sa.Column("id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("user_id", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column(
            "provider",
            sqlmodel.sql.sqltypes.AutoString(),
            server_default="linkedin",
            nullable=False,
        ),
        sa.Column(
            "provider_user_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False
        ),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("expires_at", sa.BigInteger(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "provider",
            "provider_user_id",
            name="uq_social_connections_provider_provider_user_id",
        ),
    )

    op.create_index(
        op.f("ix_social_connections_id"),
        "social_connections",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_social_connections_user_id"),
        "social_connections",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_social_connections_provider"),
        "social_connections",
        ["provider"],
        unique=False,
    )
    op.create_index(
        op.f("ix_social_connections_provider_user_id"),
        "social_connections",
        ["provider_user_id"],
        unique=False,
    )


def downgrade():
    op.drop_index(op.f("ix_social_connections_provider_user_id"), table_name="social_connections")
    op.drop_index(op.f("ix_social_connections_provider"), table_name="social_connections")
    op.drop_index(op.f("ix_social_connections_user_id"), table_name="social_connections")
    op.drop_index(op.f("ix_social_connections_id"), table_name="social_connections")
    op.drop_table("social_connections")
