"""Orchestration ingestion juridique → SQLite + ChromaDB."""

from __future__ import annotations

import logging
from collections import defaultdict
from pathlib import Path
from typing import Any

import chromadb
import yaml

from src.config import (
    COLLECTION_NAME,
    COLLECTION_NAME_QUESTIONS,
    DOMAINES,
    PDF_DIR,
    PDF_MANIFEST_FILE,
    RAG_DUAL_COLLECTION,
    WEB_SOURCES_FILE,
)
from src.ingestion.chunk_enricher import enrich_chunk, questions_embedding_text
from src.ingestion.pdf_legal_parser import parse_legal_pdf
from src.ingestion.web_scraper import scrape_url
from src.rag.embeddings import E5EmbeddingFunction
from src.storage.source_registry import ArticleRecord, SourceRegistry, now_iso

log = logging.getLogger(__name__)


def _meta_str(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, bool):
        return "1" if v else "0"
    return str(v)


def _load_yaml(path: Path) -> list | dict:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data or []


def run_legal_ingest_pipeline(
    *,
    registry: SourceRegistry,
    chroma_path: str,
    clear_registry: bool = True,
    enrich: bool = True,
) -> int:
    """Recrée les collections Chroma principales + remplit ``sources.db``."""
    if clear_registry:
        registry.clear_all()

    client = chromadb.PersistentClient(path=chroma_path)
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    emb = E5EmbeddingFunction(prefix="passage: ")
    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=emb,
        metadata={"description": "Corpus juridique — pipeline légal"},
    )
    q_collection = None
    if RAG_DUAL_COLLECTION:
        try:
            client.delete_collection(COLLECTION_NAME_QUESTIONS)
        except Exception:
            pass
        q_collection = client.create_collection(
            name=COLLECTION_NAME_QUESTIONS,
            embedding_function=emb,
            metadata={"description": "Questions enrichies — pipeline légal"},
        )

    manifest_raw = _load_yaml(PDF_MANIFEST_FILE)
    manifest = {
        entry["file"]: entry
        for entry in manifest_raw
        if isinstance(entry, dict) and "file" in entry
    }
    all_chunks: list[dict[str, Any]] = []

    for pdf_file in sorted(PDF_DIR.glob("*.pdf")):
        entry = manifest.get(pdf_file.name)
        if entry is None:
            log.info("[skip] %s absent du manifest", pdf_file.name)
            continue
        domaine_key = entry.get("domaine")
        if domaine_key not in DOMAINES:
            continue
        domaine_meta = DOMAINES[domaine_key]
        source_label = entry.get("source") or domaine_meta["source"]
        try:
            raw_chunks = parse_legal_pdf(
                pdf_file,
                source_doc=pdf_file.name,
                pdf_path_rel=str(pdf_file.relative_to(PDF_DIR)),
            )
        except Exception as exc:  # noqa: BLE001
            log.warning("parse_legal_pdf %s : %s", pdf_file.name, exc)
            continue
        for c in raw_chunks:
            c["domaine"] = domaine_key
            c["domaine_label"] = domaine_meta["label"]
            c["source"] = source_label
            c["file"] = pdf_file.name
            c["article"] = c.get("article_num") or f"page {c.get('page', '?')}"
        all_chunks.extend(raw_chunks)

    sources = _load_yaml(WEB_SOURCES_FILE)
    if isinstance(sources, list):
        for entry in sources:
            if not isinstance(entry, dict):
                continue
            url = entry.get("url")
            domaine_key = entry.get("domaine")
            if not url or domaine_key not in DOMAINES:
                continue
            domaine_meta = DOMAINES[domaine_key]
            source_label = entry.get("source") or domaine_meta["source"]
            try:
                web_chunks = scrape_url(url, domaine_key)
            except Exception as exc:  # noqa: BLE001
                log.warning("scrape_url %s : %s", url, exc)
                continue
            for c in web_chunks:
                c["domaine"] = domaine_key
                c["domaine_label"] = domaine_meta["label"]
                c["source"] = source_label
                c["file"] = ""
                c["page"] = 0
                c["article"] = c.get("article_num") or url
                c.setdefault("source_doc", url)
                c.setdefault("pdf_path", "")
            all_chunks.extend(web_chunks)

    by_logical: dict[str, list[str]] = defaultdict(list)
    for ch in all_chunks:
        logical = str(ch.get("logical_article_id") or ch.get("article_id") or "")
        if logical:
            by_logical[logical].append(ch["text"])

    for logical_id, texts in by_logical.items():
        first = next(
            (
                c
                for c in all_chunks
                if str(c.get("logical_article_id") or c.get("article_id")) == logical_id
            ),
            None,
        )
        if first is None:
            continue
        full_text = "\n\n".join(texts)
        rec = ArticleRecord(
            article_id=logical_id,
            source_doc=str(first.get("source_doc") or first.get("source") or "unknown"),
            livre=first.get("livre"),
            titre=first.get("titre"),
            chapitre=first.get("chapitre"),
            section=first.get("section"),
            article_num=str(first.get("article_num") or logical_id),
            article_label=first.get("article_label"),
            full_text=full_text,
            page_start=int(first.get("page") or 0) or None,
            page_end=int(first.get("page") or 0) or None,
            pdf_path=first.get("pdf_path") or None,
            url_source=first.get("url"),
            date_indexed=now_iso(),
        )
        registry.upsert_article(rec)

    ids: list[str] = []
    documents: list[str] = []
    metadatas: list[dict[str, Any]] = []
    q_documents: list[str] = []
    q_ids: list[str] = []
    q_metadatas: list[dict[str, Any]] = []
    total = 0
    # Ne pas nommer la variable du résultat « enrich » : elle masquerait le paramètre booléen.
    use_haiku_enrich = enrich

    for i, ch in enumerate(all_chunks):
        text = ch["text"]
        enrichment = enrich_chunk(text) if use_haiku_enrich else {"summary": "", "questions": []}
        aid = str(ch.get("article_id") or f"UNK_{i}")
        logical = str(ch.get("logical_article_id") or aid)

        bm25_parts = [text]
        if enrichment.get("summary"):
            bm25_parts.append(enrichment["summary"])
        bm25_parts.extend(enrichment.get("questions") or [])
        bm25_text = "\n".join(bm25_parts)
        registry.upsert_rag_chunk(aid, logical, bm25_text)

        meta = {
            "domaine": _meta_str(ch.get("domaine")),
            "domaine_label": _meta_str(ch.get("domaine_label")),
            "source": _meta_str(ch.get("source")),
            "page": int(ch.get("page") or 0),
            "article": _meta_str(ch.get("article_num") or ch.get("article")),
            "file": _meta_str(ch.get("file")),
            "source_type": _meta_str(ch.get("source_type")),
            "article_id": aid,
            "logical_article_id": logical,
            "livre": _meta_str(ch.get("livre")),
            "titre": _meta_str(ch.get("titre")),
            "chapitre": _meta_str(ch.get("chapitre")),
            "section": _meta_str(ch.get("section")),
            "article_num": _meta_str(ch.get("article_num")),
            "article_label": _meta_str(ch.get("article_label")),
            "chunk_type": _meta_str(ch.get("type")),
            "source_doc": _meta_str(ch.get("source_doc")),
            "pdf_path": _meta_str(ch.get("pdf_path")),
            "url": _meta_str(ch.get("url")),
            "hierarchy_key": _meta_str(ch.get("hierarchy_key")),
        }
        ids.append(aid)
        documents.append(text)
        metadatas.append(meta)
        total += 1

        if q_collection is not None:
            qtxt = questions_embedding_text(enrichment)
            q_ids.append(f"{aid}__q")
            q_documents.append(qtxt)
            qm = dict(meta)
            qm["chunk_uid"] = aid
            q_metadatas.append(qm)

    batch = 128
    for start in range(0, len(ids), batch):
        collection.add(
            ids=ids[start : start + batch],
            documents=documents[start : start + batch],
            metadatas=metadatas[start : start + batch],
        )
    if q_collection is not None and q_ids:
        for start in range(0, len(q_ids), batch):
            q_collection.add(
                ids=q_ids[start : start + batch],
                documents=q_documents[start : start + batch],
                metadatas=q_metadatas[start : start + batch],
            )

    log.info("Pipeline légal : %s chunks indexés.", total)
    return total
