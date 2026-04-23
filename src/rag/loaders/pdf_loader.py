"""Loader PDF — extraction texte page par page via pypdf + chunking."""

from __future__ import annotations

import logging
import re
from pathlib import Path

from pypdf import PdfReader

from src.rag.loaders.splitter import split_by_chars

log = logging.getLogger(__name__)

_HYPHEN_BREAK_RE = re.compile(r"-\n(\w)")
_MULTISPACE_RE = re.compile(r"[ \t]+")
_MULTINEWLINE_RE = re.compile(r"\n{3,}")


def _clean_page_text(text: str) -> str:
    """Nettoie le texte extrait d'une page PDF (césures, espaces, sauts de ligne)."""
    text = _HYPHEN_BREAK_RE.sub(r"\1", text)
    text = _MULTISPACE_RE.sub(" ", text)
    text = _MULTINEWLINE_RE.sub("\n\n", text)
    return text.strip()


def parse_pdf(path: Path) -> list[dict]:
    """Découpe un PDF en chunks de taille bornée, un ou plusieurs chunks par page.

    Retourne une liste de dicts ``{text, page, source_type}``.
    Page est 1-indexée. Les pages vides (scan sans OCR) sont ignorées avec un log.
    """
    try:
        reader = PdfReader(str(path))
    except Exception as exc:  # noqa: BLE001
        log.warning("Échec lecture PDF %s : %s", path, exc)
        return []

    chunks: list[dict] = []
    for page_index, page in enumerate(reader.pages, start=1):
        try:
            raw = page.extract_text() or ""
        except Exception as exc:  # noqa: BLE001
            log.warning("Échec extraction page %d de %s : %s", page_index, path.name, exc)
            continue
        cleaned = _clean_page_text(raw)
        if not cleaned:
            continue
        for sub in split_by_chars(cleaned):
            chunks.append({"text": sub, "page": page_index, "source_type": "pdf"})
    return chunks
