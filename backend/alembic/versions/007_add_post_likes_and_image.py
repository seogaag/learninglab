"""add post likes and image

Revision ID: 007
Revises: 006
Create Date: 2024-01-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # posts 테이블에 image_url과 like_count 추가
    op.add_column('posts', sa.Column('image_url', sa.String(), nullable=True))
    op.add_column('posts', sa.Column('like_count', sa.Integer(), nullable=True, server_default='0'))
    
    # post_likes 테이블 생성
    op.create_table(
        'post_likes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('post_id', 'user_id', name='uq_post_likes')
    )
    op.create_index(op.f('ix_post_likes_id'), 'post_likes', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_post_likes_id'), table_name='post_likes')
    op.drop_table('post_likes')
    op.drop_column('posts', 'like_count')
    op.drop_column('posts', 'image_url')
