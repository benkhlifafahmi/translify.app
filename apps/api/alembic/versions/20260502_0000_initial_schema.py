"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-02

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # users (FastAPI-Users base + extras)
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(length=1024), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("is_superuser", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("is_verified", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("display_name", sa.String(length=120), nullable=True),
        sa.Column("preferred_language", sa.String(length=8), nullable=False, server_default="en"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # books
    book_status = postgresql.ENUM(
        "uploaded", "processing", "ready", "failed", name="book_status"
    )
    book_status.create(op.get_bind(), checkfirst=True)
    book_format = postgresql.ENUM("pdf", "epub", name="book_format")
    book_format.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "books",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("author", sa.String(length=500), nullable=True),
        sa.Column("source_language", sa.String(length=8), nullable=True),
        sa.Column(
            "format",
            postgresql.ENUM("pdf", "epub", name="book_format", create_type=False),
            nullable=False,
        ),
        sa.Column("file_key", sa.String(length=500), nullable=False),
        sa.Column("file_size_bytes", sa.Integer, nullable=False),
        sa.Column("page_count", sa.Integer, nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "uploaded", "processing", "ready", "failed",
                name="book_status", create_type=False,
            ),
            nullable=False,
            server_default="uploaded",
        ),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_books_user_id", "books", ["user_id"])
    op.create_index("ix_books_status", "books", ["status"])

    # chunks (with vector(1024))
    op.create_table(
        "chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "book_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("books.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("ordinal", sa.Integer, nullable=False),
        sa.Column("page_start", sa.Integer, nullable=True),
        sa.Column("page_end", sa.Integer, nullable=True),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("token_count", sa.Integer, nullable=False),
        sa.Column("embedding", Vector(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_chunks_book_id", "chunks", ["book_id"])
    # HNSW index for cosine similarity
    op.execute(
        "CREATE INDEX ix_chunks_embedding_hnsw ON chunks "
        "USING hnsw (embedding vector_cosine_ops)"
    )

    # translations
    translation_status = postgresql.ENUM(
        "queued", "in_progress", "ready", "failed", name="translation_status"
    )
    translation_status.create(op.get_bind(), checkfirst=True)
    translation_provider = postgresql.ENUM(
        "deepl", "anthropic", name="translation_provider"
    )
    translation_provider.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "translations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "book_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("books.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("target_language", sa.String(length=8), nullable=False),
        sa.Column(
            "provider",
            postgresql.ENUM("deepl", "anthropic", name="translation_provider", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "status",
            postgresql.ENUM(
                "queued", "in_progress", "ready", "failed",
                name="translation_status", create_type=False,
            ),
            nullable=False,
            server_default="queued",
        ),
        sa.Column("progress_pct", sa.Integer, nullable=False, server_default="0"),
        sa.Column("output_file_key", sa.String(length=500), nullable=True),
        sa.Column("output_format", sa.String(length=16), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("chars_translated", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("book_id", "target_language", name="uq_translation_book_lang"),
    )
    op.create_index("ix_translations_book_id", "translations", ["book_id"])
    op.create_index("ix_translations_status", "translations", ["status"])

    # chats + messages
    chat_scope = postgresql.ENUM("book", "library", name="chat_scope")
    chat_scope.create(op.get_bind(), checkfirst=True)
    message_role = postgresql.ENUM("user", "assistant", "system", name="message_role")
    message_role.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "chats",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "scope",
            postgresql.ENUM("book", "library", name="chat_scope", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "book_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("books.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("title", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_chats_user_id", "chats", ["user_id"])
    op.create_index("ix_chats_book_id", "chats", ["book_id"])

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "chat_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("chats.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "role",
            postgresql.ENUM("user", "assistant", "system", name="message_role", create_type=False),
            nullable=False,
        ),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("citations", postgresql.JSONB, nullable=True),
        sa.Column("input_tokens", sa.Integer, nullable=True),
        sa.Column("output_tokens", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_messages_chat_id", "messages", ["chat_id"])
    op.create_index("ix_messages_created_at", "messages", ["created_at"])

    # quizzes + attempts
    op.create_table(
        "quizzes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "book_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("books.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("scope_label", sa.String(length=200), nullable=True),
        sa.Column("questions", postgresql.JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_quizzes_book_id", "quizzes", ["book_id"])
    op.create_index("ix_quizzes_user_id", "quizzes", ["user_id"])

    op.create_table(
        "quiz_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "quiz_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("quizzes.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("answers", postgresql.JSONB, nullable=False),
        sa.Column("score", sa.Integer, nullable=False),
        sa.Column("total", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_quiz_attempts_quiz_id", "quiz_attempts", ["quiz_id"])
    op.create_index("ix_quiz_attempts_user_id", "quiz_attempts", ["user_id"])


def downgrade() -> None:
    op.drop_table("quiz_attempts")
    op.drop_table("quizzes")
    op.drop_table("messages")
    op.drop_table("chats")
    op.drop_table("translations")
    op.drop_index("ix_chunks_embedding_hnsw", table_name="chunks")
    op.drop_table("chunks")
    op.drop_table("books")
    op.drop_table("users")

    for enum_name in (
        "message_role", "chat_scope",
        "translation_provider", "translation_status",
        "book_format", "book_status",
    ):
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
