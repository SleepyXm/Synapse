"""Add knowledge-base product metadata.

Revision ID: 005_knowledge_service
Revises: 004_user_preferences
Create Date: 2026-09-06

River owns its queue schema through River migrations. Original files are held
by object storage and searchable text/vectors are held by Qdrant.
"""

import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine import make_url


revision: str = "005_knowledge_service"
down_revision: Union[str, Sequence[str], None] = "004_user_preferences"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "knowledge_bases",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("index_version", sa.Text(), nullable=False, server_default="v2"),
        sa.Column("index_generation", sa.BigInteger(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("char_length(name) BETWEEN 1 AND 100", name="knowledge_bases_name_length"),
        sa.CheckConstraint("char_length(description) <= 1000", name="knowledge_bases_description_length"),
        sa.ForeignKeyConstraint(["user_id"], ["public.users.id"], name="knowledge_bases_user_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="knowledge_bases_pkey"),
        sa.UniqueConstraint("user_id", "name", name="knowledge_bases_user_name_key"),
        schema="public",
    )

    op.create_table(
        "knowledge_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("knowledge_base_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("filename", sa.Text(), nullable=False),
        sa.Column("mime_type", sa.Text(), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("storage_key", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False, server_default="queued"),
        sa.Column("index_generation", sa.BigInteger(), nullable=False),
        sa.Column("index_stage", sa.Text(), nullable=False, server_default="pending"),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("chunk_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("size_bytes >= 0", name="knowledge_documents_size_nonnegative"),
        sa.CheckConstraint("status IN ('queued', 'processing', 'ready', 'failed')", name="knowledge_documents_status_valid"),
        sa.CheckConstraint("index_stage IN ('pending', 'dense', 'sparse', 'ready')", name="knowledge_documents_stage_valid"),
        sa.ForeignKeyConstraint(["knowledge_base_id"], ["public.knowledge_bases.id"], name="knowledge_documents_base_id_fkey", ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name="knowledge_documents_pkey"),
        sa.UniqueConstraint("knowledge_base_id", "sha256", name="knowledge_documents_base_sha256_key"),
        schema="public",
    )
    op.create_index("knowledge_documents_base_created_idx", "knowledge_documents", ["knowledge_base_id", "created_at"], schema="public")
    op.create_index("knowledge_documents_generation_stage_idx", "knowledge_documents", ["knowledge_base_id", "index_generation", "index_stage"], schema="public")

    database_url = os.getenv("DATABASE")
    runtime_username = make_url(database_url).username if database_url else None
    if not runtime_username:
        raise RuntimeError("DATABASE must include the API database role")
    runtime_role = op.get_bind().dialect.identifier_preparer.quote(runtime_username)
    for table in (
        "knowledge_bases",
        "knowledge_documents",
    ):
        op.execute(f"GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.{table} TO {runtime_role}")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS public.knowledge_documents_generation_stage_idx")
    op.execute("DROP INDEX IF EXISTS public.knowledge_documents_base_created_idx")
    op.drop_table("knowledge_documents", schema="public")
    op.drop_table("knowledge_bases", schema="public")
