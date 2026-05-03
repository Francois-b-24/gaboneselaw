"""Scraping web juridique avec trafilatura et chunking adaptatif."""

from __future__ import annotations

import hashlib
import logging
import re
from datetime import datetime, timezone
from typing import Any
log = logging.getLogger(__name__)

_RE_ARTICLE_LINE = re.compile(
    r"(Article\s+\d+|Décret\s+n°|Loi\s+n°|Circulaire\s+n°)",
    re.IGNORECASE,
)


def _overlap_paragraphs(text: str, overlap_ratio: float = 0.15) -> list[str]:
    """Découpe en paragraphes avec recouvrement approximatif."""
    paras = [p.strip() for p in re.split(r"\n\s*\n+", text) if p.strip()]
    if len(paras) <= 1:
        return paras
    out: list[str] = []
    for i, p in enumerate(paras):
        if not out:
            out.append(p)
            continue
        prev = out[-1]
        overlap_n = max(1, int(len(p) * overlap_ratio))
        bridge = p[:overlap_n] if overlap_n < len(p) else p
        out.append(f"{bridge}\n\n{p}".strip())
    return out


def _legal_chunks_from_text(
    text: str,
    *,
    url: str,
    title: str,
    scraped_at: str,
    domaine: str,
) -> list[dict[str, Any]]:
    """Si le texte ressemble à un acte découpé par articles ; sinon paragraphes."""
    if _RE_ARTICLE_LINE.search(text):
        parts = re.split(
            r"(?=Article\s+\d+|Décret\s+n°|Loi\s+n°|Circulaire\s+n°)",
            text,
            flags=re.IGNORECASE,
        )
        chunks = [p.strip() for p in parts if p.strip() and len(p.strip()) > 40]
    else:
        chunks = _overlap_paragraphs(text)
    out: list[dict[str, Any]] = []
    url_hash = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
    for i, c in enumerate(chunks):
        logical = f"WEB_{url_hash}_{i}"
        out.append(
            {
                "text": c,
                "url": url,
                "title": title,
                "scraped_at": scraped_at,
                "source_type": "web",
                "domaine_key": domaine,
                "article_num": title[:120] if title else url,
                "article_id": logical,
                "logical_article_id": logical,
                "type": "web_segment",
            }
        )
    return out


def scrape_url(url: str, domaine: str) -> list[dict[str, Any]]:
    try:
        import trafilatura
    except ImportError as exc:
        raise ImportError("trafilatura est requis pour scrape_url") from exc

    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        log.warning("trafilatura.fetch_url vide pour %s", url)
        return []
    text = trafilatura.extract(downloaded, include_comments=False, include_tables=True)
    if not text or len(text.strip()) < 50:
        return []
    meta = trafilatura.extract_metadata(downloaded)
    title = (meta.title if meta else None) or ""
    scraped = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return _legal_chunks_from_text(text, url=url, title=title, scraped_at=scraped, domaine=domaine)
