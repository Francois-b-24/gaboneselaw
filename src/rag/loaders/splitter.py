"""Découpage de texte en sous-chunks bornés par ``CHUNK_MAX_CHARS``."""

from __future__ import annotations

from src.config import CHUNK_MAX_CHARS


def split_by_chars(
    text: str,
    max_chars: int = CHUNK_MAX_CHARS,
    separator: str = "\n\n",
) -> list[str]:
    """Découpe ``text`` en morceaux <= ``max_chars`` sans casser les paragraphes.

    Si un paragraphe seul dépasse ``max_chars``, il est coupé durement
    (garde-fou pour les PDFs mal structurés).
    """
    text = text.strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    buf = ""
    for para in text.split(separator):
        para = para.strip()
        if not para:
            continue
        if len(para) > max_chars:
            if buf:
                chunks.append(buf.strip())
                buf = ""
            for i in range(0, len(para), max_chars):
                chunks.append(para[i : i + max_chars])
            continue
        if len(buf) + len(para) + len(separator) > max_chars and buf:
            chunks.append(buf.strip())
            buf = para
        else:
            buf = f"{buf}{separator}{para}" if buf else para
    if buf.strip():
        chunks.append(buf.strip())
    return chunks
