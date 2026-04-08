"""Ingestion du corpus juridique dans ChromaDB.

Usage :
    python -m src.rag.ingest

Parcourt ``data/legal_corpus/*.md``, découpe chaque fichier par article
(``## Article ...``), crée les embeddings et insère le tout dans une
collection Chroma persistante.

Idempotent : supprime et recrée la collection à chaque exécution.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import chromadb

from src.config import (
    CHROMA_PATH,
    CHUNK_MAX_CHARS,
    COLLECTION_NAME,
    CORPUS_DIR,
    DOMAINES,
)
from src.rag.embeddings import E5EmbeddingFunction

ARTICLE_SPLIT_RE = re.compile(r"\n(?=##\s+Article\b)", re.IGNORECASE)
ARTICLE_HEADER_RE = re.compile(r"^##\s+(Article[^\n]+)", re.IGNORECASE)


def parse_markdown(path: Path) -> list[dict]:
    """Découpe un fichier markdown en chunks par article.

    Retourne une liste de dicts ``{text, article}``.
    """
    content = path.read_text(encoding="utf-8")
    # On retire l'en-tête (# Titre ...) et le préambule éventuel avant le premier article.
    parts = ARTICLE_SPLIT_RE.split(content)
    chunks: list[dict] = []
    for part in parts:
        part = part.strip()
        if not part.lower().startswith("## article"):
            continue
        header_match = ARTICLE_HEADER_RE.match(part)
        article_label = header_match.group(1).strip() if header_match else "Article"
        # Tronçonnage de secours si l'article est anormalement long
        if len(part) <= CHUNK_MAX_CHARS:
            chunks.append({"text": part, "article": article_label})
        else:
            # Split par paragraphes
            buf = ""
            for para in part.split("\n\n"):
                if len(buf) + len(para) + 2 > CHUNK_MAX_CHARS and buf:
                    chunks.append({"text": buf.strip(), "article": article_label})
                    buf = para
                else:
                    buf = f"{buf}\n\n{para}" if buf else para
            if buf.strip():
                chunks.append({"text": buf.strip(), "article": article_label})
    return chunks


def main() -> int:
    if not CORPUS_DIR.exists():
        print(f"[ERREUR] Dossier corpus introuvable : {CORPUS_DIR}", file=sys.stderr)
        return 1

    client = chromadb.PersistentClient(path=CHROMA_PATH)

    # Recréation propre de la collection
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"[info] Collection existante '{COLLECTION_NAME}' supprimée.")
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=E5EmbeddingFunction(prefix="passage: "),
        metadata={"description": "Corpus juridique gabonais — démo"},
    )

    total = 0
    for md_file in sorted(CORPUS_DIR.glob("*.md")):
        domaine_key = md_file.stem  # ex: "travail"
        if domaine_key not in DOMAINES:
            print(f"[skip] {md_file.name} : domaine inconnu ({domaine_key})")
            continue

        domaine_meta = DOMAINES[domaine_key]
        chunks = parse_markdown(md_file)
        if not chunks:
            print(f"[skip] {md_file.name} : aucun article détecté")
            continue

        ids = [f"{domaine_key}-{i}" for i in range(len(chunks))]
        documents = [c["text"] for c in chunks]
        metadatas = [
            {
                "domaine": domaine_key,
                "domaine_label": domaine_meta["label"],
                "source": domaine_meta["source"],
                "article": c["article"],
                "file": md_file.name,
            }
            for c in chunks
        ]
        collection.add(ids=ids, documents=documents, metadatas=metadatas)
        total += len(chunks)
        print(f"[ok] {md_file.name} : {len(chunks)} chunks indexés")

    print(f"\n✅ {total} chunks indexés dans la collection '{COLLECTION_NAME}'.")
    print(f"   Persistance : {CHROMA_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
