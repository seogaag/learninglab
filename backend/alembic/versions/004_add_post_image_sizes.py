"""add post image_sizes

Revision ID: 004
Revises: 003
Create Date: 2024-01-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('posts', sa.Column('image_sizes', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('posts', 'image_sizes')
