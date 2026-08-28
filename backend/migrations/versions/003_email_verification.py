"""Add fields used by the existing email verification handler.

Revision ID: 003_email_verification
Revises: 002_email_auth
Create Date: 2026-08-27
"""

from typing import Sequence, Union

from alembic import op


revision: str = "003_email_verification"
down_revision: Union[str, Sequence[str], None] = "002_email_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE public.users " "ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false" )
    op.execute("ALTER TABLE public.users " "ADD COLUMN IF NOT EXISTS verification_token TEXT")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS users_verification_token_key " "ON public.users (verification_token) WHERE verification_token IS NOT NULL"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS public.users_verification_token_key")
    op.execute("ALTER TABLE public.users DROP COLUMN IF EXISTS verification_token")
    op.execute("ALTER TABLE public.users DROP COLUMN IF EXISTS verified")
