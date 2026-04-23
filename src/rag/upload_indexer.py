"""Indexation à la volée d'un PDF uploadé depuis l'UI Streamlit.

La collection ``droit_gabonais_uploads`` est recréée à chaque upload
(comportement identique à ``ingest.main`` pour la collection principale).
Elle n'est pas persistée entre sessions — c'est volontaire : l'analyse
ponctuelle d'un document ne doit pas polluer le corpus de référence.
"""

from __future__ import annotations

import logging
from pathlib import Path

import chromadb

from src.config import CHROMA_PATH, UPLOAD_COLLECTION_NAME
from src.rag.embeddings import E5EmbeddingFunction
from src.rag.loaders import parse_pdf

log = logging.getLogger(__name__)


def index_uploaded_pdf(path: Path, filename: str) -> int:
    """Extrait et indexe un PDF dans la collection d'uploads. Retourne le nb de chunks."""
    chunks = parse_pdf(path)
    if not chunks:
        log.warning("Aucun texte extrait de %s", filename)
        return 0

    client = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        client.delete_collection(UPLOAD_COLLECTION_NAME)
    except Exception:
        pass

    collection = client.create_collection(
        name=UPLOAD_COLLECTION_NAME,
        embedding_function=E5EmbeddingFunction(prefix="passage: "),
        metadata={"description": "PDFs uploadés — session courante uniquement"},
    )

    ids = [f"upload-{i}" for i in range(len(chunks))]
    documents = [c["text"] for c in chunks]
    metadatas = [
        {
            "source": f"Document uploadé : {filename}",
            "page": c["page"],
            "article": f"page {c['page']}",
            "file": filename,
            "source_type": "pdf_upload",
        }
        for c in chunks
    ]
    collection.add(ids=ids, documents=documents, metadatas=metadatas)
    return len(chunks)


def clear_upload_collection() -> None:
    """Vide la collection d'uploads (appelé quand l'utilisateur retire le fichier)."""
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        client.delete_collection(UPLOAD_COLLECTION_NAME)
    except Exception:
        pass
