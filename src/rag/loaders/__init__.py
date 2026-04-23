"""Loaders de sources pour l'indexation RAG.

Chaque loader retourne une liste de ``dict`` avec au minimum une clé
``text`` (contenu du chunk) et les métadonnées propres au format :
- ``page`` pour le PDF ;
- ``url``, ``title`` pour le web.

Tous les dicts portent aussi ``source_type`` ∈ {``pdf``, ``web``} pour
permettre le filtrage côté retriever.

Le dispatcher ``load_source`` choisit le loader selon l'extension ; pour
les URLs, utiliser ``load_url``.
"""

from __future__ import annotations

from pathlib import Path

from src.rag.loaders.pdf_loader import parse_pdf
from src.rag.loaders.splitter import split_by_chars
from src.rag.loaders.web_loader import parse_web

__all__ = [
    "load_source",
    "load_url",
    "parse_pdf",
    "parse_web",
    "split_by_chars",
    "source_type_from_path",
]


def source_type_from_path(path: Path) -> str:
    """Déduit le type de source (`pdf`) à partir de l'extension."""
    if path.suffix.lower() == ".pdf":
        return "pdf"
    return "unknown"


def load_source(path: Path) -> list[dict]:
    """Dispatch vers le bon loader selon l'extension.

    Retourne une liste vide si le format n'est pas supporté.
    """
    if source_type_from_path(path) == "pdf":
        return parse_pdf(path)
    return []


def load_url(url: str) -> list[dict]:
    """Scrape une URL et retourne les chunks extraits.

    Wrapper minimaliste autour de ``parse_web`` pour uniformiser l'API
    avec ``load_source``.
    """
    return parse_web(url)
