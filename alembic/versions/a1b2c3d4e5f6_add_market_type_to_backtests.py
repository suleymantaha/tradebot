"""add market_type to backtests

Revision ID: a1b2c3d4e5f6
Revises: 8dff47bdfa5f
Create Date: 2025-09-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '8dff47bdfa5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add market_type with default 'spot'
    op.add_column('backtests', sa.Column('market_type', sa.String(), nullable=False, server_default='spot'))


def downgrade() -> None:
    op.drop_column('backtests', 'market_type')


