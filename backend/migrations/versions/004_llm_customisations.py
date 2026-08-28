"""Add reusable LLM customisations.

Revision ID: 004_user_preferences
Revises: 003_email_verification
Create Date: 2026-08-28
"""

import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine import make_url


revision: str = "004_user_preferences"
down_revision: Union[str, Sequence[str], None] = "003_email_verification"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "llm_customisations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()"),),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("system_prompt", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"),),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()"),),



        sa.CheckConstraint("char_length(name) BETWEEN 1 AND 100", name="llm_customisations_name_length",),
        sa.CheckConstraint("char_length(system_prompt) BETWEEN 1 AND 8000", name="llm_customisations_prompt_length",),


        sa.ForeignKeyConstraint(["user_id"], ["public.users.id"], name="llm_customisations_user_id_fkey", ondelete="CASCADE",),
        sa.PrimaryKeyConstraint("id", name="llm_customisations_pkey"),
        sa.UniqueConstraint("user_id", "name", name="llm_customisations_user_name_key"),
        schema="public",
    )

    database_url = os.getenv("DATABASE")
    runtime_username = make_url(database_url).username if database_url else None
    if not runtime_username:
        raise RuntimeError("DATABASE must include the API database role")
    runtime_role = op.get_bind().dialect.identifier_preparer.quote(runtime_username)
    op.execute("GRANT SELECT, INSERT, UPDATE, DELETE " f"ON TABLE public.llm_customisations TO {runtime_role}")


def downgrade() -> None:
    # This revision previously created user_preferences. Keeping the revision ID
    # lets an existing local database downgrade before applying the replacement.
    op.execute("DROP TABLE IF EXISTS public.llm_customisations")
    op.execute("DROP TABLE IF EXISTS public.user_preferences")
