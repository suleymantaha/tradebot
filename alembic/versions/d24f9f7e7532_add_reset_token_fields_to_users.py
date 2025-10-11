"""add_reset_token_fields_to_users

Revision ID: d24f9f7e7532
Revises: 8dff47bdfa5f
Create Date: 2025-05-30 13:44:34.846456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd24f9f7e7532'
down_revision: Union[str, None] = '8dff47bdfa5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema with conditional column creation."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = {col['name'] for col in inspector.get_columns('users')}

    if 'reset_token' not in existing_cols:
        op.add_column('users', sa.Column('reset_token', sa.String(), nullable=True))
    if 'reset_token_expires' not in existing_cols:
        op.add_column('users', sa.Column('reset_token_expires', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema with conditional drops."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_cols = {col['name'] for col in inspector.get_columns('users')}

    if 'reset_token_expires' in existing_cols:
        op.drop_column('users', 'reset_token_expires')
    if 'reset_token' in existing_cols:
        op.drop_column('users', 'reset_token')
