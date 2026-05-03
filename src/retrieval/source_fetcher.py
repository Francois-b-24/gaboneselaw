"""Récupération d'articles depuis le registre SQLite."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from src.config import PDF_DIR, PROJECT_ROOT
from src.storage.source_registry import ArticleRecord, SourceRegistry


class SourceFetcher:
    def __init__(self, registry: SourceRegistry | None = None) -> None:
        self._registry = registry or SourceRegistry()

    def get_article_by_id(self, article_id: str) -> ArticleRecord | None:
        return self._registry.get_by_id(article_id)

    def get_article_full_text(self, article_id: str) -> str:
        return self._registry.get_full_text(article_id) or ""

    def get_article_context(self, article_id: str) -> dict[str, Any]:
        return self._registry.get_context(article_id)

    def get_article_pdf_link(self, article_id: str, page: int | None = None) -> str:
        """Chemin fichier local (pas d'URL signée) ; le client peut ouvrir le PDF."""
        rec = self._registry.get_by_id(article_id)
        if not rec or not rec.pdf_path:
            return ""
        base = PDF_DIR / rec.pdf_path
        if base.exists():
            return str(base.resolve())
        alt = PROJECT_ROOT / "data" / "pdfs" / Path(rec.pdf_path).name
        if alt.exists():
            return str(alt.resolve())
        return str(base)
