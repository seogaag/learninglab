"""create community tables (posts, comments, tags, etc.)

Revision ID: 006
Revises: 005
Create Date: 2024-01-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = None  # Changed from '005' as it doesn't exist
branch_labels = None
depends_on = None


def upgrade() -> None:
    # posts table
    op.create_table(
        'posts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_type', sa.Enum('NOTICE', 'FORUM', 'REQUEST', name='posttype'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('author_email', sa.String(), nullable=False),
        sa.Column('author_name', sa.String(), nullable=True),
        sa.Column('is_pinned', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('view_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_posts_id'), 'posts', ['id'], unique=False)
    
    # comments table
    op.create_table(
        'comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('author_email', sa.String(), nullable=False),
        sa.Column('author_name', sa.String(), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['comments.id'], ),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_comments_id'), 'comments', ['id'], unique=False)
    
    # tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_tags_id'), 'tags', ['id'], unique=False)
    op.create_index(op.f('ix_tags_name'), 'tags', ['name'], unique=False)
    
    # post_tags table
    op.create_table(
        'post_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_post_tags_id'), 'post_tags', ['id'], unique=False)
    
    # post_mentions table
    op.create_table(
        'post_mentions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('post_id', sa.Integer(), nullable=False),
        sa.Column('mentioned_email', sa.String(), nullable=False),
        sa.Column('mentioned_name', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['post_id'], ['posts.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_post_mentions_id'), 'post_mentions', ['id'], unique=False)
    op.create_index(op.f('ix_post_mentions_mentioned_email'), 'post_mentions', ['mentioned_email'], unique=False)
    
    # comment_mentions table
    op.create_table(
        'comment_mentions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('comment_id', sa.Integer(), nullable=False),
        sa.Column('mentioned_email', sa.String(), nullable=False),
        sa.Column('mentioned_name', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['comment_id'], ['comments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_comment_mentions_id'), 'comment_mentions', ['id'], unique=False)
    op.create_index(op.f('ix_comment_mentions_mentioned_email'), 'comment_mentions', ['mentioned_email'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_comment_mentions_mentioned_email'), table_name='comment_mentions')
    op.drop_index(op.f('ix_comment_mentions_id'), table_name='comment_mentions')
    op.drop_table('comment_mentions')
    op.drop_index(op.f('ix_post_mentions_mentioned_email'), table_name='post_mentions')
    op.drop_index(op.f('ix_post_mentions_id'), table_name='post_mentions')
    op.drop_table('post_mentions')
    op.drop_index(op.f('ix_post_tags_id'), table_name='post_tags')
    op.drop_table('post_tags')
    op.drop_index(op.f('ix_tags_name'), table_name='tags')
    op.drop_index(op.f('ix_tags_id'), table_name='tags')
    op.drop_table('tags')
    op.drop_index(op.f('ix_comments_id'), table_name='comments')
    op.drop_table('comments')
    op.drop_index(op.f('ix_posts_id'), table_name='posts')
    op.drop_table('posts')
    op.execute('DROP TYPE posttype')
