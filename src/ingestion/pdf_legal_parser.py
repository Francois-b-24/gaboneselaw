"""Parsing PDF juridique : hiérarchie Livre / Titre / Chapitre / Article.

Utilise pdfplumber pour le texte ; camelot en option pour les tableaux.
Unité atomique = article complet (découpe par paragraphes si trop long).
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

from src.config import CHUNK_MAX_CHARS, PDF_DIR

log = logging.getLogger(__name__)

_RE_LIVRE = re.compile(r"^\s*(LIVRE\s+[IVXLCDM]+)\s*$", re.IGNORECASE)
_RE_TITRE = re.compile(r"^\s*(TITRE\s+[IVXLCDM]+[^\n]*)\s*$", re.IGNORECASE)
_RE_CHAP = re.compile(r"^\s*(CHAPITRE\s+[IVXLCDM]+[^\n]*)\s*$", re.IGNORECASE)
_RE_SECTION = re.compile(r"^\s*(Section\s+\d+[^\n]*)\s*$", re.IGNORECASE)
_RE_ARTICLE = re.compile(
    r"^\s*(Article\s+\d+(?:\s*(?:bis|ter|quater|quinquies|sexies|septies|octies|nonies))?)\s*[-–—]?\s*(.*)$",
    re.IGNORECASE,
)

_MAX_CHARS_SOFT = CHUNK_MAX_CHARS


def _slug_doc(stem: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "_", stem).strip("_").upper()[:40]
    return s or "DOC"


def _norm_article_key(article_num: str) -> str:
    m = re.match(
        r"article\s+(\d+)\s*(bis|ter|quater|quinquies|sexies|septies|octies|nonies)?",
        article_num.strip(),
        re.IGNORECASE,
    )
    if not m:
        return re.sub(r"\W+", "_", article_num.upper())[:48]
    num, suf = m.group(1), (m.group(2) or "").upper()
    return f"ART_{num}" + (f"_{suf}" if suf else "")


def _split_oversized_article(body: str, max_chars: int = _MAX_CHARS_SOFT) -> list[str]:
    if len(body) <= max_chars:
        return [body]
    parts: list[str] = []
    paras = re.split(r"\n\s*\n", body)
    buf = ""
    for p in paras:
        p = p.strip()
        if not p:
            continue
        if len(buf) + len(p) + 2 <= max_chars:
            buf = f"{buf}\n\n{p}".strip() if buf else p
        else:
            if buf:
                parts.append(buf.strip())
            if len(p) > max_chars:
                for i in range(0, len(p), max_chars):
                    parts.append(p[i : i + max_chars])
                buf = ""
            else:
                buf = p
    if buf:
        parts.append(buf.strip())
    return parts


def parse_legal_pdf(
    path: Path,
    *,
    source_doc: str,
    pdf_path_rel: str | None = None,
) -> list[dict[str, Any]]:
    try:
        import pdfplumber
    except ImportError as exc:
        raise ImportError("pdfplumber est requis pour parse_legal_pdf") from exc

    doc_slug = _slug_doc(path.stem)
    try:
        rel = pdf_path_rel or (str(path.relative_to(PDF_DIR)) if path.is_relative_to(PDF_DIR) else path.name)
    except ValueError:
        rel = pdf_path_rel or path.name

    livre = ""
    titre = ""
    chapitre = ""
    section = ""
    current_article_num = ""
    current_article_label = ""
    article_body_lines: list[str] = []
    article_start_page = 1
    emit_seq = 0
    chunks_out: list[dict[str, Any]] = []

    def flush_article(end_page: int) -> None:
        nonlocal article_body_lines, current_article_num, current_article_label, article_start_page, emit_seq
        body = "\n".join(article_body_lines).strip()
        article_body_lines = []
        if not current_article_num and not body:
            return
        if not current_article_num:
            current_article_num = "Bloc"
        is_bloc = current_article_num == "Bloc"
        key = _norm_article_key(current_article_num)
        article_id = f"{doc_slug}_{key}"
        subchunks = _split_oversized_article(body)
        for i, sub in enumerate(subchunks):
            emit_seq += 1
            chunk_uid = f"{article_id}__E{emit_seq:06d}"
            logical_article_id = chunk_uid if is_bloc else article_id
            hier = " > ".join(
                x for x in (livre, titre, chapitre, section, current_article_num) if x
            )
            chunks_out.append(
                {
                    "text": f"{current_article_num} — {current_article_label}\n\n{sub}".strip(),
                    "page": article_start_page,
                    "source_type": "pdf",
                    "livre": livre or None,
                    "titre": titre or None,
                    "chapitre": chapitre or None,
                    "section": section or None,
                    "article_num": current_article_num,
                    "article_label": current_article_label or None,
                    "type": "article",
                    "article_id": chunk_uid,
                    "logical_article_id": logical_article_id,
                    "chunk_part": i,
                    "source_doc": source_doc,
                    "pdf_path": rel,
                    "hierarchy_key": hier,
                }
            )

    with pdfplumber.open(path) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            for line in text.splitlines():
                raw = line.strip()
                if not raw:
                    continue
                if _RE_LIVRE.match(raw):
                    flush_article(page_index)
                    livre = _RE_LIVRE.match(raw).group(1).strip()
                    titre = chapitre = section = ""
                    current_article_num = current_article_label = ""
                    article_start_page = page_index
                    continue
                if _RE_TITRE.match(raw):
                    flush_article(page_index)
                    titre = _RE_TITRE.match(raw).group(1).strip()
                    chapitre = section = ""
                    current_article_num = current_article_label = ""
                    article_start_page = page_index
                    continue
                if _RE_CHAP.match(raw):
                    flush_article(page_index)
                    chapitre = _RE_CHAP.match(raw).group(1).strip()
                    section = ""
                    current_article_num = current_article_label = ""
                    article_start_page = page_index
                    continue
                if _RE_SECTION.match(raw):
                    flush_article(page_index)
                    section = _RE_SECTION.match(raw).group(1).strip()
                    current_article_num = current_article_label = ""
                    article_start_page = page_index
                    continue
                m_a = _RE_ARTICLE.match(raw)
                if m_a:
                    flush_article(page_index)
                    current_article_num = m_a.group(1).strip()
                    current_article_label = (m_a.group(2) or "").strip()
                    article_start_page = page_index
                    continue
                article_body_lines.append(raw)

        flush_article(len(pdf.pages))

    # Tableaux camelot (optionnel)
    try:
        import camelot
    except ImportError:
        return chunks_out

    try:
        tables = camelot.read_pdf(str(path), pages="all", flavor="lattice")
        for ti, table in enumerate(tables):
            md = table.df.to_markdown(index=False)
            p = int(table.page)
            tid = f"{doc_slug}_TABLE_{ti}"
            chunks_out.append(
                {
                    "text": f"[Tableau extrait]\n{md}",
                    "page": p,
                    "source_type": "pdf",
                    "livre": livre or None,
                    "titre": titre or None,
                    "chapitre": chapitre or None,
                    "section": None,
                    "article_num": f"Tableau {ti + 1}",
                    "article_label": "Données tabulaires",
                    "type": "tableau",
                    "article_id": tid,
                    "logical_article_id": tid,
                    "chunk_part": 0,
                    "source_doc": source_doc,
                    "pdf_path": rel,
                    "hierarchy_key": f"{source_doc} > Tableau {ti + 1}",
                }
            )
    except Exception as exc:  # noqa: BLE001
        log.warning("camelot: extraction tableau ignorée pour %s : %s", path.name, exc)

    return chunks_out
