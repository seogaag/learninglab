"""add workspace_course start_date

Revision ID: 003
Revises: 002_sequences
Create Date: 2024-01-05 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002_sequences'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE workspace_courses
        ADD COLUMN IF NOT EXISTS start_date DATE
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE workspace_courses DROP COLUMN IF EXISTS start_date")
