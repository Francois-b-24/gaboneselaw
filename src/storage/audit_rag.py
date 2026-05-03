"""Journal d'audit RAG (SQLite)."""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.config import AUDIT_RAG_DB_PATH

_SCHEMA = """
CREATE TABLE IF NOT EXISTS rag_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    question TEXT,
    reformulations TEXT,
    chunk_ids TEXT,
    answer_excerpt TEXT,
    citations_validated TEXT,
    duration_ms INTEGER
);
"""


class RAGAuditLog:
    def __init__(self, db_path: Path | None = None) -> None:
        self._path = Path(db_path or AUDIT_RAG_DB_PATH)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self._path) as conn:
            conn.executescript(_SCHEMA)
            conn.commit()

    def log_turn(
        self,
        *,
        question: str,
        reformulations: list[str] | None,
        chunk_ids: list[str],
        answer: str,
        citations_validated: list[bool] | None,
        duration_ms: int,
    ) -> None:
        with sqlite3.connect(self._path) as conn:
            conn.execute(
                """
                INSERT INTO rag_audit (
                    ts, question, reformulations, chunk_ids,
                    answer_excerpt, citations_validated, duration_ms
                ) VALUES (?,?,?,?,?,?,?)
                """,
                (
                    datetime.now(timezone.utc).isoformat(),
                    question[:4000],
                    json.dumps(reformulations or [], ensure_ascii=False),
                    json.dumps(chunk_ids[:500], ensure_ascii=False),
                    answer[:8000],
                    json.dumps(citations_validated or [], ensure_ascii=False),
                    duration_ms,
                ),
            )
            conn.commit()
