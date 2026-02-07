"""Add refresh token to users table

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('google_refresh_token', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'google_refresh_token')
