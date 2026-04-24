"""Ingestion unifiée du corpus juridique dans ChromaDB.

Usage :
    python -m src.rag.ingest

Pipeline :
  1. PDF        — ``data/pdfs/*.pdf`` + ``data/pdfs/manifest.yaml``
  2. Web        — URLs listées dans ``data/web_sources.yaml``

Toutes les sources sont indexées dans la même collection Chroma
``droit_gabonais``, différenciées par la métadonnée ``source_type`` ∈
{``pdf``, ``web``}.

Idempotent : supprime et recrée la collection à chaque exécution.
"""

from __future__ import annotations

import logging
import re
import sys
from urllib.parse import urlparse
from pathlib import Path

import chromadb
import yaml

from src.config import (
    CHROMA_PATH,
    COLLECTION_NAME,
    DOMAINES,
    PDF_DIR,
    PDF_MANIFEST_FILE,
    WEB_SOURCES_FILE,
)
from src.rag.embeddings import E5EmbeddingFunction
from src.rag.loaders import discover_pdf_links, load_source, load_url, parse_pdf_url

log = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _slugify(text: str) -> str:
    return _SLUG_RE.sub("-", text.lower()).strip("-") or "item"


def _load_yaml(path: Path) -> list | dict:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data or []


def _ingest_pdfs(collection) -> int:
    if not PDF_DIR.exists():
        return 0
    manifest_raw = _load_yaml(PDF_MANIFEST_FILE)
    manifest = {entry["file"]: entry for entry in manifest_raw if isinstance(entry, dict) and "file" in entry}

    total = 0
    for pdf_file in sorted(PDF_DIR.glob("*.pdf")):
        entry = manifest.get(pdf_file.name)
        if entry is None:
            print(f"[skip] {pdf_file.name} : absent de manifest.yaml")
            continue
        domaine_key = entry.get("domaine")
        if domaine_key not in DOMAINES:
            print(f"[skip] {pdf_file.name} : domaine inconnu ({domaine_key})")
            continue
        domaine_meta = DOMAINES[domaine_key]
        source_label = entry.get("source") or domaine_meta["source"]
        chunks = load_source(pdf_file)
        if not chunks:
            print(f"[skip] {pdf_file.name} : aucun texte extrait (PDF scanné ?)")
            continue
        stem = _slugify(pdf_file.stem)
        ids = [f"pdf-{stem}-{i}" for i in range(len(chunks))]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "domaine": domaine_key,
                "domaine_label": domaine_meta["label"],
                "source": source_label,
                "page": c["page"],
                "article": f"page {c['page']}",
                "file": pdf_file.name,
                "source_type": "pdf",
            }
            for c in chunks
        ]
        collection.add(ids=ids, documents=documents, metadatas=metadatas)
        total += len(chunks)
        print(f"[ok] {pdf_file.name} : {len(chunks)} chunks indexés")
    return total


def _ingest_web(collection) -> int:
    sources = _load_yaml(WEB_SOURCES_FILE)
    if not isinstance(sources, list) or not sources:
        return 0
    total = 0
    for entry in sources:
        if not isinstance(entry, dict):
            continue
        url = entry.get("url")
        domaine_key = entry.get("domaine")
        if not url or domaine_key not in DOMAINES:
            print(f"[skip] web : entrée invalide {entry!r}")
            continue
        domaine_meta = DOMAINES[domaine_key]
        source_label = entry.get("source") or domaine_meta["source"]
        chunks = load_url(url)
        if not chunks:
            print(f"[skip] {url} : contenu vide ou erreur réseau")
            continue
        slug = _slugify(url)[:60]
        ids = [f"web-{slug}-{i}" for i in range(len(chunks))]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "domaine": domaine_key,
                "domaine_label": domaine_meta["label"],
                "source": source_label,
                "url": c["url"],
                "title": c.get("title", ""),
                "scraped_at": c.get("scraped_at", ""),
                "article": c.get("title") or url,
                "source_type": "web",
            }
            for c in chunks
        ]
        collection.add(ids=ids, documents=documents, metadatas=metadatas)
        total += len(chunks)
        print(f"[ok] {url} : {len(chunks)} chunks indexés")

        # Optionnel: crawler le site et indexer les PDFs détectés.
        if entry.get("discover_pdfs") is True:
            max_pages = int(entry.get("crawl_max_pages", 20))
            max_pdfs = int(entry.get("crawl_max_pdfs", 30))
            max_depth = int(entry.get("crawl_max_depth", 2))
            pdf_urls = discover_pdf_links(
                url,
                max_pages=max_pages,
                max_pdfs=max_pdfs,
                max_depth=max_depth,
            )
            if not pdf_urls:
                print(f"[info] {url} : aucun PDF détecté via crawl")
                continue

            for pdf_url in pdf_urls:
                pdf_chunks = parse_pdf_url(pdf_url)
                if not pdf_chunks:
                    print(f"[skip] {pdf_url} : PDF vide/inaccessible")
                    continue

                file_name = Path(urlparse(pdf_url).path).name or "document.pdf"
                stem = _slugify(pdf_url)[:60]
                ids = [f"webpdf-{stem}-{i}" for i in range(len(pdf_chunks))]
                documents = [c["text"] for c in pdf_chunks]
                metadatas = [
                    {
                        "domaine": domaine_key,
                        "domaine_label": domaine_meta["label"],
                        "source": source_label,
                        "url": pdf_url,
                        "title": file_name,
                        "scraped_at": "",
                        "article": f"page {c.get('page', '?')}",
                        "page": c.get("page"),
                        "file": file_name,
                        "source_type": "pdf",
                    }
                    for c in pdf_chunks
                ]
                collection.add(ids=ids, documents=documents, metadatas=metadatas)
                total += len(pdf_chunks)
                print(f"[ok] {pdf_url} : {len(pdf_chunks)} chunks PDF indexés")
    return total


def main() -> int:
    client = chromadb.PersistentClient(path=CHROMA_PATH)

    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"[info] Collection existante '{COLLECTION_NAME}' supprimée.")
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=E5EmbeddingFunction(prefix="passage: "),
        metadata={"description": "Corpus juridique gabonais — PDF + Web"},
    )

    total = 0
    total += _ingest_pdfs(collection)
    total += _ingest_web(collection)

    if total == 0:
        print("[ERREUR] Aucun chunk indexé. Vérifier le corpus.", file=sys.stderr)
        return 1

    print(f"\n✅ {total} chunks indexés dans la collection '{COLLECTION_NAME}'.")
    print(f"   Persistance : {CHROMA_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
