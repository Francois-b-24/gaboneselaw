"""Registre SQLite des articles juridiques (texte intégral + navigation).

Schéma aligné sur la spec RAG : table ``articles`` + table ``rag_chunks``
pour le sparse BM25 au niveau chunk.
"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from src.config import SOURCES_DB_PATH


@dataclass
class ArticleRecord:
    article_id: str
    source_doc: str
    livre: str | None
    titre: str | None
    chapitre: str | None
    section: str | None
    article_num: str
    article_label: str | None
    full_text: str
    page_start: int | None
    page_end: int | None
    pdf_path: str | None
    url_source: str | None
    date_indexed: str


_SCHEMA = """
CREATE TABLE IF NOT EXISTS articles (
    article_id TEXT PRIMARY KEY,
    source_doc TEXT NOT NULL,
    livre TEXT,
    titre TEXT,
    chapitre TEXT,
    section TEXT,
    article_num TEXT NOT NULL,
    article_label TEXT,
    full_text TEXT NOT NULL,
    page_start INTEGER,
    page_end INTEGER,
    pdf_path TEXT,
    url_source TEXT,
    date_indexed TEXT
);

CREATE TABLE IF NOT EXISTS rag_chunks (
    chunk_uid TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    bm25_text TEXT NOT NULL,
    FOREIGN KEY (article_id) REFERENCES articles(article_id)
);

CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_doc);
CREATE INDEX IF NOT EXISTS idx_chunks_article ON rag_chunks(article_id);
"""


class SourceRegistry:
    """Accès SQLite thread-safe (nouvelle connexion par opération)."""

    def __init__(self, db_path: Path | None = None) -> None:
        self._path = Path(db_path or SOURCES_DB_PATH)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    @property
    def db_path(self) -> Path:
        return self._path

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript(_SCHEMA)
            conn.commit()

    @contextmanager
    def _connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self._path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def upsert_article(self, record: ArticleRecord) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO articles (
                    article_id, source_doc, livre, titre, chapitre, section,
                    article_num, article_label, full_text, page_start, page_end,
                    pdf_path, url_source, date_indexed
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                ON CONFLICT(article_id) DO UPDATE SET
                    source_doc=excluded.source_doc,
                    livre=excluded.livre,
                    titre=excluded.titre,
                    chapitre=excluded.chapitre,
                    section=excluded.section,
                    article_num=excluded.article_num,
                    article_label=excluded.article_label,
                    full_text=excluded.full_text,
                    page_start=excluded.page_start,
                    page_end=excluded.page_end,
                    pdf_path=excluded.pdf_path,
                    url_source=excluded.url_source,
                    date_indexed=excluded.date_indexed
                """,
                (
                    record.article_id,
                    record.source_doc,
                    record.livre,
                    record.titre,
                    record.chapitre,
                    record.section,
                    record.article_num,
                    record.article_label,
                    record.full_text,
                    record.page_start,
                    record.page_end,
                    record.pdf_path,
                    record.url_source,
                    record.date_indexed,
                ),
            )
            conn.commit()

    def upsert_rag_chunk(self, chunk_uid: str, article_id: str, bm25_text: str) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO rag_chunks (chunk_uid, article_id, bm25_text)
                VALUES (?,?,?)
                ON CONFLICT(chunk_uid) DO UPDATE SET
                    article_id=excluded.article_id,
                    bm25_text=excluded.bm25_text
                """,
                (chunk_uid, article_id, bm25_text),
            )
            conn.commit()

    def get_by_id(self, article_id: str) -> ArticleRecord | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM articles WHERE article_id = ?", (article_id,)
            ).fetchone()
            if row is None:
                return None
            return self._row_to_record(row)

    def get_full_text(self, article_id: str) -> str | None:
        rec = self.get_by_id(article_id)
        return rec.full_text if rec else None

    def get_neighbor_ids(self, article_id: str) -> tuple[str | None, str | None]:
        """Retourne (previous_article_id, next_article_id) selon l'ordre d'insertion logique.

        Ordre : même source_doc, puis article_num trié alphabétiquement (approximation).
        """
        rec = self.get_by_id(article_id)
        if rec is None:
            return None, None
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT article_id FROM articles
                WHERE source_doc = ?
                ORDER BY article_num
                """,
                (rec.source_doc,),
            ).fetchall()
        ids = [r["article_id"] for r in rows]
        try:
            idx = ids.index(article_id)
        except ValueError:
            return None, None
        prev_id = ids[idx - 1] if idx > 0 else None
        next_id = ids[idx + 1] if idx + 1 < len(ids) else None
        return prev_id, next_id

    def get_context(self, article_id: str) -> dict[str, Any]:
        """Article courant + précédent + suivant (texte intégral)."""
        cur = self.get_by_id(article_id)
        prev_id, next_id = self.get_neighbor_ids(article_id)
        prev_rec = self.get_by_id(prev_id) if prev_id else None
        next_rec = self.get_by_id(next_id) if next_id else None
        return {
            "current": article_to_json_dict(cur) if cur else None,
            "previous": article_to_json_dict(prev_rec) if prev_rec else None,
            "next": article_to_json_dict(next_rec) if next_rec else None,
        }

    def iter_bm25_corpus(self) -> list[tuple[str, str]]:
        """Liste (chunk_uid, bm25_text) pour construire l'index BM25."""
        with self._connect() as conn:
            rows = conn.execute("SELECT chunk_uid, bm25_text FROM rag_chunks").fetchall()
        return [(r["chunk_uid"], r["bm25_text"]) for r in rows]

    def list_article_ids_by_num_substring(self, needle: str, limit: int = 50) -> list[str]:
        like = f"%{needle}%"
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT article_id FROM articles
                WHERE article_num LIKE ? OR full_text LIKE ?
                LIMIT ?
                """,
                (like, like, limit),
            ).fetchall()
        return [r["article_id"] for r in rows]

    def clear_all(self) -> None:
        with self._connect() as conn:
            conn.execute("DELETE FROM rag_chunks")
            conn.execute("DELETE FROM articles")
            conn.commit()

    @staticmethod
    def _row_to_record(row: sqlite3.Row) -> ArticleRecord:
        return ArticleRecord(
            article_id=row["article_id"],
            source_doc=row["source_doc"],
            livre=row["livre"],
            titre=row["titre"],
            chapitre=row["chapitre"],
            section=row["section"],
            article_num=row["article_num"],
            article_label=row["article_label"],
            full_text=row["full_text"],
            page_start=row["page_start"],
            page_end=row["page_end"],
            pdf_path=row["pdf_path"],
            url_source=row["url_source"],
            date_indexed=row["date_indexed"],
        )


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def article_to_json_dict(rec: ArticleRecord) -> dict[str, Any]:
    return {
        "article_id": rec.article_id,
        "source_doc": rec.source_doc,
        "livre": rec.livre,
        "titre": rec.titre,
        "chapitre": rec.chapitre,
        "section": rec.section,
        "article_num": rec.article_num,
        "article_label": rec.article_label,
        "full_text": rec.full_text,
        "page_start": rec.page_start,
        "page_end": rec.page_end,
        "pdf_path": rec.pdf_path,
        "url_source": rec.url_source,
        "date_indexed": rec.date_indexed,
    }
