"""add template recurrence and icon fields

Revision ID: 20250604_000004
Revises: 20250121_000002
Create Date: 2025-06-04 00:00:04.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250604_000004'
down_revision = '20250121_000002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add icon, isRecurring, and recurrenceInterval to templates table
    op.add_column('templates', sa.Column('icon', sa.Text(), nullable=True))
    op.add_column('templates', sa.Column('is_recurring', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('templates', sa.Column('recurrence_interval', sa.Text(), nullable=True))
    
    # Add completed_at to runs table for tracking completion time
    op.add_column('runs', sa.Column('completed_at', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('runs', 'completed_at')
    op.drop_column('templates', 'recurrence_interval')
    op.drop_column('templates', 'is_recurring')
    op.drop_column('templates', 'icon')

