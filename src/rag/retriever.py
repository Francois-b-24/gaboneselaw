"""Retriever Chroma pour le corpus juridique."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import chromadb

from src.config import CHROMA_PATH, COLLECTION_NAME, TOP_K
from src.rag.embeddings import E5EmbeddingFunction, embed_query


@dataclass
class LegalChunk:
    text: str
    metadata: dict[str, Any]
    score: float  # similarité (1 - distance cosinus)

    @property
    def citation(self) -> str:
        source = self.metadata.get("source", "Source inconnue")
        article = self.metadata.get("article", "")
        return f"{source} — {article}" if article else source


class LegalRetriever:
    """Wrapper léger autour de la collection Chroma."""

    def __init__(self) -> None:
        self._client = chromadb.PersistentClient(path=CHROMA_PATH)
        self._collection = self._client.get_collection(
            name=COLLECTION_NAME,
            embedding_function=E5EmbeddingFunction(prefix="passage: "),
        )

    def search(
        self,
        query: str,
        domaine: str | None = None,
        k: int = TOP_K,
    ) -> list[LegalChunk]:
        """Recherche sémantique.

        :param query: question de l'utilisateur
        :param domaine: clé de domaine (``travail``/``foncier``/``famille``) ou None
        :param k: nombre de résultats
        """
        where: dict[str, Any] | None = {"domaine": domaine} if domaine else None
        # On utilise embed_query pour appliquer le préfixe "query:" du modèle e5
        query_embedding = embed_query(query)

        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            where=where,
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        chunks: list[LegalChunk] = []
        for text, meta, dist in zip(documents, metadatas, distances):
            # Embeddings normalisés -> distance cosinus ∈ [0, 2], score = 1 - dist/2
            score = max(0.0, 1.0 - (dist / 2.0))
            chunks.append(LegalChunk(text=text, metadata=meta or {}, score=score))
        return chunks
