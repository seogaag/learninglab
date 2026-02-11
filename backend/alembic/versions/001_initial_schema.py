"""initial schema - complete database structure

Revision ID: 001
Revises: None
Create Date: 2024-01-03 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users table (기본 테이블)
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('google_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('picture', sa.String(), nullable=True),
        sa.Column('google_refresh_token', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # admins table
    op.create_table(
        'admins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_admins_id'), 'admins', ['id'], unique=False)
    op.create_index(op.f('ix_admins_username'), 'admins', ['username'], unique=True)
    
    # banners table
    op.create_table(
        'banners',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('subtitle', sa.String(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=False),
        sa.Column('link_url', sa.String(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_banners_id'), 'banners', ['id'], unique=False)
    
    # oauth_states table
    op.create_table(
        'oauth_states',
        sa.Column('state', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('state')
    )
    op.create_index(op.f('ix_oauth_states_state'), 'oauth_states', ['state'], unique=False)
    
    # workspace_courses table
    op.create_table(
        'workspace_courses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('section', sa.String(), nullable=True),
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('alternate_link', sa.String(), nullable=True),
        sa.Column('course_state', sa.String(), nullable=True, server_default='ACTIVE'),
        sa.Column('organization', sa.String(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_workspace_courses_id'), 'workspace_courses', ['id'], unique=False)
    
    # page_sections table
    op.create_table(
        'page_sections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('section_type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_page_sections_id'), 'page_sections', ['id'], unique=False)
    
    # posts table (최종 버전: image_url, like_count, is_resolved 포함)
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
        sa.Column('image_url', sa.String(), nullable=True),
        sa.Column('like_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('is_resolved', sa.Boolean(), nullable=True, server_default='false'),
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
    
    # post_likes table
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
    op.drop_index(op.f('ix_page_sections_id'), table_name='page_sections')
    op.drop_table('page_sections')
    op.drop_index(op.f('ix_workspace_courses_id'), table_name='workspace_courses')
    op.drop_table('workspace_courses')
    op.drop_index(op.f('ix_oauth_states_state'), table_name='oauth_states')
    op.drop_table('oauth_states')
    op.drop_index(op.f('ix_banners_id'), table_name='banners')
    op.drop_table('banners')
    op.drop_index(op.f('ix_admins_username'), table_name='admins')
    op.drop_index(op.f('ix_admins_id'), table_name='admins')
    op.drop_table('admins')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_google_id'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
