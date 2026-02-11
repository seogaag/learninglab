"""add is_resolved to posts

Revision ID: 008
Revises: 007
Create Date: 2024-01-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # posts 테이블에 is_resolved 필드 추가
    op.add_column('posts', sa.Column('is_resolved', sa.Boolean(), nullable=True, server_default='false'))


def downgrade() -> None:
    op.drop_column('posts', 'is_resolved')
