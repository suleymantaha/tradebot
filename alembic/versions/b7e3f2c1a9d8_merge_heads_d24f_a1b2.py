"""merge heads d24f9f7e7532 and a1b2c3d4e5f6

Revision ID: b7e3f2c1a9d8
Revises: d24f9f7e7532, a1b2c3d4e5f6
Create Date: 2025-10-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa  # noqa: F401  (kept for consistency)


# revision identifiers, used by Alembic.
revision: str = "b7e3f2c1a9d8"
down_revision: Union[str, Sequence[str], None] = ("d24f9f7e7532", "a1b2c3d4e5f6")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge heads; no schema changes."""
    # This is an empty merge migration to unify multiple heads.
    pass


def downgrade() -> None:
    """No-op downgrade for merge revision."""
    # Downgrading a merge revision would split branches; keep as no-op.
    pass

