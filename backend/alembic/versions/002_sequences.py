"""002_sequences - alembic version stub (DB에 002_sequences 기록된 경우 대응)

Revision ID: 002_sequences
Revises: 001
Create Date: 2024-01-04 00:00:00.000000

"""
from alembic import op

revision = '002_sequences'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # posts에 누락된 컬럼 추가 (IF NOT EXISTS로 기존 DB 안전 처리)
    op.execute("""
        ALTER TABLE posts
        ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false
    """)
    op.execute("""
        ALTER TABLE posts
        ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE posts DROP COLUMN IF EXISTS is_resolved")
    op.execute("ALTER TABLE posts DROP COLUMN IF EXISTS like_count")
