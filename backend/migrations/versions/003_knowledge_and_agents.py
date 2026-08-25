"""Add durable knowledge ingestion, vector search, and agent profiles.

Revision ID: 003_knowledge_and_agents
Revises: 002_email_auth
Create Date: 2026-08-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "003_knowledge_and_agents"
down_revision: Union[str, Sequence[str], None] = "002_email_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "knowledge_bases",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("embedding_model_id", sa.Text(), nullable=False),
        sa.Column("hf_token_name", sa.Text(), nullable=False),
        sa.Column("embedding_dimension", sa.Integer(), nullable=True),
        sa.Column("chunk_size_runes", sa.Integer(), nullable=False, server_default="1500"),
        sa.Column("chunk_overlap_runes", sa.Integer(), nullable=False, server_default="200"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("char_length(btrim(name)) BETWEEN 1 AND 100", name="knowledge_bases_name_length"),
        sa.CheckConstraint("char_length(btrim(description)) BETWEEN 1 AND 500", name="knowledge_bases_description_length"),
        sa.CheckConstraint("chunk_size_runes > 0", name="knowledge_bases_chunk_size_positive"),
        sa.CheckConstraint("chunk_overlap_runes >= 0 AND chunk_overlap_runes < chunk_size_runes", name="knowledge_bases_chunk_overlap_valid"),
        sa.ForeignKeyConstraint(["user_id"], ["public.users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="public",
    )
    op.create_index("knowledge_bases_user_id_idx", "knowledge_bases", ["user_id"], schema="public")

    op.create_table(
        "knowledge_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("knowledge_base_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("filename", sa.Text(), nullable=False),
        sa.Column("media_type", sa.Text(), nullable=False),
        sa.Column("object_key", sa.Text(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="queued"),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("status IN ('queued', 'processing', 'ready', 'failed')", name="knowledge_documents_status_valid"),
        sa.ForeignKeyConstraint(["knowledge_base_id"], ["public.knowledge_bases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("knowledge_base_id", "sha256", name="knowledge_documents_base_sha256_key"),
        sa.UniqueConstraint("object_key", name="knowledge_documents_object_key_key"),
        schema="public",
    )
    op.create_index("knowledge_documents_queue_idx", "knowledge_documents", ["status", "created_at"], schema="public")

    op.execute(
        """
        CREATE TABLE public.knowledge_chunks (
            id text PRIMARY KEY,
            knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
            document_id uuid NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
            chunk_index integer NOT NULL,
            page_number integer,
            content text NOT NULL,
            metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
            embedding_model_id text NOT NULL,
            embedding vector NOT NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT knowledge_chunks_document_index_key UNIQUE (document_id, chunk_index)
        )
        """
    )
    op.create_index("knowledge_chunks_base_document_idx", "knowledge_chunks", ["knowledge_base_id", "document_id"], schema="public")

    op.create_table(
        "agents",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("instructions", sa.Text(), nullable=False),
        sa.Column("model_id", sa.Text(), nullable=False),
        sa.Column("hf_token_name", sa.Text(), nullable=False),
        sa.Column("tool_ids", postgresql.ARRAY(sa.Text()), nullable=False, server_default=sa.text("'{}'::text[]")),
        sa.Column("settings", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("max_steps", sa.Integer(), nullable=False, server_default="6"),
        sa.Column("timeout_seconds", sa.Integer(), nullable=False, server_default="120"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("max_steps BETWEEN 1 AND 10", name="agents_max_steps_valid"),
        sa.CheckConstraint("timeout_seconds BETWEEN 1 AND 600", name="agents_timeout_valid"),
        sa.ForeignKeyConstraint(["user_id"], ["public.users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="public",
    )
    op.create_index("agents_user_id_idx", "agents", ["user_id"], schema="public")

    op.create_table(
        "agent_knowledge_bases",
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("knowledge_base_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(["agent_id"], ["public.agents.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["knowledge_base_id"], ["public.knowledge_bases.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("agent_id", "knowledge_base_id"),
        schema="public",
    )

    op.create_table(
        "agent_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("model_id", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="running"),
        sa.Column("input", sa.Text(), nullable=False),
        sa.Column("output", sa.Text(), nullable=True),
        sa.Column("failure_code", sa.Text(), nullable=True),
        sa.Column("failure_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("status IN ('running', 'completed', 'failed')", name="agent_runs_status_valid"),
        sa.ForeignKeyConstraint(["user_id"], ["public.users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["agent_id"], ["public.agents.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["conversation_id"], ["public.conversations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        schema="public",
    )
    op.create_index("agent_runs_user_created_idx", "agent_runs", ["user_id", "created_at"], schema="public")

    op.create_table(
        "agent_run_steps",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("ordinal", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("tool_name", sa.Text(), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["run_id"], ["public.agent_runs.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("run_id", "ordinal", name="agent_run_steps_run_ordinal_key"),
        schema="public",
    )


def downgrade() -> None:
    op.drop_table("agent_run_steps", schema="public")
    op.drop_index("agent_runs_user_created_idx", table_name="agent_runs", schema="public")
    op.drop_table("agent_runs", schema="public")
    op.drop_table("agent_knowledge_bases", schema="public")
    op.drop_index("agents_user_id_idx", table_name="agents", schema="public")
    op.drop_table("agents", schema="public")
    op.drop_index("knowledge_chunks_base_document_idx", table_name="knowledge_chunks", schema="public")
    op.drop_table("knowledge_chunks", schema="public")
    op.drop_index("knowledge_documents_queue_idx", table_name="knowledge_documents", schema="public")
    op.drop_table("knowledge_documents", schema="public")
    op.drop_index("knowledge_bases_user_id_idx", table_name="knowledge_bases", schema="public")
    op.drop_table("knowledge_bases", schema="public")
