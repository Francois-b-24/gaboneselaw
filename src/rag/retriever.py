"""Retriever Chroma pour le corpus juridique."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any

import chromadb

from src.config import CHROMA_PATH, COLLECTION_NAME, TOP_K, UPLOAD_COLLECTION_NAME
from src.rag.embeddings import E5EmbeddingFunction, embed_query

log = logging.getLogger(__name__)


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

    def __init__(self, collection_name: str = COLLECTION_NAME) -> None:
        self._client = chromadb.PersistentClient(path=CHROMA_PATH)
        self._collection = self._client.get_collection(
            name=collection_name,
            embedding_function=E5EmbeddingFunction(prefix="passage: "),
        )

    def _query_collection(
        self,
        collection,
        query_embedding: list[float],
        k: int,
        where: dict[str, Any] | None,
    ) -> list[LegalChunk]:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            where=where,
        )
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        chunks: list[LegalChunk] = []
        for text, meta, dist in zip(documents, metadatas, distances):
            score = max(0.0, 1.0 - (dist / 2.0))
            chunks.append(LegalChunk(text=text, metadata=meta or {}, score=score))
        return chunks

    def search(
        self,
        query: str,
        domaine: str | None = None,
        k: int = TOP_K,
        include_uploads: bool = False,
    ) -> list[LegalChunk]:
        """Recherche sémantique.

        :param query: question de l'utilisateur
        :param domaine: clé de domaine (``travail``/``foncier``/``famille``) ou None
        :param k: nombre de résultats final
        :param include_uploads: si True, fusionne les résultats de la collection
            ``droit_gabonais_uploads`` (PDFs uploadés à la volée, si présente)
        """
        where: dict[str, Any] | None = {"domaine": domaine} if domaine else None
        query_embedding = embed_query(query)

        chunks = self._query_collection(self._collection, query_embedding, k, where)

        if include_uploads:
            upload_collection = _get_upload_collection(self._client)
            if upload_collection is not None:
                # Pas de filtre domaine sur les uploads : l'utilisateur a uploadé
                # un doc pour cette session, on veut tout voir.
                upload_chunks = self._query_collection(
                    upload_collection, query_embedding, k, where=None
                )
                chunks = sorted(chunks + upload_chunks, key=lambda c: c.score, reverse=True)[:k]

        return chunks

    def get_article(
        self,
        article: str,
        domaine: str | None = None,
    ) -> list[LegalChunk]:
        """Recherche un article spécifique par son numéro dans les métadonnées.

        :param article: numéro ou nom de l'article (ex: ``"72"``, ``"Article 75"``)
        :param domaine: filtre de domaine optionnel
        """
        match = re.search(r"\d+", article)
        if not match:
            return []
        numero = match.group()

        where: dict | None = {"domaine": domaine} if domaine else None

        results = self._collection.get(where=where)

        documents = results.get("documents", [])
        metadatas = results.get("metadatas", [])

        chunks: list[LegalChunk] = []
        for text, meta in zip(documents, metadatas):
            article_field = (meta or {}).get("article", "")
            if re.search(rf"\b{numero}\b", article_field):
                chunks.append(
                    LegalChunk(text=text, metadata=meta or {}, score=1.0)
                )
        return chunks


def _get_upload_collection(client):
    """Retourne la collection d'uploads si elle existe, sinon None."""
    try:
        return client.get_collection(
            name=UPLOAD_COLLECTION_NAME,
            embedding_function=E5EmbeddingFunction(prefix="passage: "),
        )
    except Exception as exc:  # noqa: BLE001
        log.debug("Collection d'uploads indisponible : %s", exc)
        return None
