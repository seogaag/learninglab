"""create admin, banner, workspace_course tables

Revision ID: 004
Revises: 003
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
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


def downgrade() -> None:
    op.drop_index(op.f('ix_workspace_courses_id'), table_name='workspace_courses')
    op.drop_table('workspace_courses')
    op.drop_index(op.f('ix_banners_id'), table_name='banners')
    op.drop_table('banners')
    op.drop_index(op.f('ix_admins_username'), table_name='admins')
    op.drop_index(op.f('ix_admins_id'), table_name='admins')
    op.drop_table('admins')
