"""Validation des citations contre ``sources.db`` (rapidfuzz)."""

from __future__ import annotations

import logging
from typing import Any

from rapidfuzz import fuzz

from src.rag.retriever import LegalChunk
from src.storage.source_registry import SourceRegistry

log = logging.getLogger(__name__)

_THRESHOLD = 90


def validate_citation_excerpt(article_id: str, excerpt: str, registry: SourceRegistry) -> tuple[bool, str | None]:
    """Vérifie que ``article_id`` existe et que ``excerpt`` correspond au texte enregistré."""
    if not article_id.strip():
        return False, "article_id vide"
    rec = registry.get_by_id(article_id)
    if rec is None:
        return False, "article_id inconnu dans sources.db"
    if not excerpt or len(excerpt.strip()) < 8:
        return True, None
    ratio = fuzz.partial_ratio(excerpt.strip(), rec.full_text)
    if ratio < _THRESHOLD:
        return False, f"excerpt non retrouvé (rapidfuzz partial_ratio={ratio})"
    return True, None


def build_and_validate_citations(
    answer: str,
    sources: list[LegalChunk],
    registry: SourceRegistry,
) -> list[dict[str, Any]]:
    """Construit une entrée de citation par source retournée (markers [1], [2], …)."""
    out: list[dict[str, Any]] = []
    for i, chunk in enumerate(sources, start=1):
        meta = chunk.metadata or {}
        aid = meta.get("logical_article_id") or meta.get("article_id") or ""
        excerpt = (chunk.text or "")[:800]
        hierarchy = meta.get("hierarchy_key") or ""
        verified, warn = (
            validate_citation_excerpt(str(aid), excerpt, registry)
            if aid
            else (False, "pas d'article_id")
        )
        if not verified:
            log.info("Citation non vérifiée [%s] : %s", aid, warn)
        marker = f"[{i}]"
        out.append(
            {
                "marker": marker,
                "article_id": str(aid) if aid else "",
                "article_num": meta.get("article_num") or meta.get("article") or "",
                "source_doc": meta.get("source_doc") or meta.get("file") or meta.get("source") or "",
                "page": meta.get("page"),
                "excerpt": excerpt,
                "hierarchy": hierarchy,
                "url_source": meta.get("url") or None,
                "verified": verified,
                "warning": None if verified else (warn or "[NON VÉRIFIÉE]"),
            }
        )
    return out
