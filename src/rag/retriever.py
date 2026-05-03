"""Retriever Chroma pour le corpus juridique."""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any

import chromadb

from src.config import CHROMA_PATH, COLLECTION_NAME, TOP_K, UPLOAD_COLLECTION_NAME, USE_HYBRID_RAG
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
        self._hybrid = None
        if USE_HYBRID_RAG:
            try:
                from src.retrieval.hybrid_search import HybridSearchEngine
                from src.storage.source_registry import SourceRegistry

                reg = SourceRegistry()
                if reg.iter_bm25_corpus():
                    self._hybrid = HybridSearchEngine(reg, collection_name=collection_name)
                else:
                    log.info("Hybrid RAG activé mais corpus BM25 vide — fallback dense.")
            except Exception as exc:  # noqa: BLE001
                log.warning("Initialisation hybrid ignorée : %s", exc)

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
        """Recherche sémantique ou hybride (dense + BM25 + RRF) selon configuration."""
        if self._hybrid is not None:
            try:
                from src.retrieval.query_rewriter import rewrite_queries

                rq = rewrite_queries(query)
                extra = [q for q in rq.get("queries", []) if q and q != query]
                chunks = self._hybrid.search(query, domaine=domaine, k=k, extra_queries=extra)
            except Exception as exc:  # noqa: BLE001
                log.warning("Hybrid search échoué, fallback dense : %s", exc)
                chunks = self._dense_search(query, domaine, k)
        else:
            chunks = self._dense_search(query, domaine, k)

        if include_uploads:
            upload_collection = _get_upload_collection(self._client)
            if upload_collection is not None:
                query_embedding = embed_query(query)
                upload_chunks = self._query_collection(
                    upload_collection, query_embedding, k, where=None
                )
                chunks = sorted(chunks + upload_chunks, key=lambda c: c.score, reverse=True)[:k]

        return chunks

    def _dense_search(
        self,
        query: str,
        domaine: str | None,
        k: int,
    ) -> list[LegalChunk]:
        where: dict[str, Any] | None = {"domaine": domaine} if domaine else None
        query_embedding = embed_query(query)
        return self._query_collection(self._collection, query_embedding, k, where)

    def get_article(
        self,
        article: str,
        domaine: str | None = None,
    ) -> list[LegalChunk]:
        """Résout un article via ``sources.db`` si disponible, sinon métadonnées Chroma."""
        try:
            from src.storage.source_registry import SourceRegistry

            reg = SourceRegistry()
            needle = re.sub(r"article\s*", "", article, flags=re.IGNORECASE).strip() or article
            ids = reg.list_article_ids_by_num_substring(needle, limit=12)
            out: list[LegalChunk] = []
            for aid in ids:
                rec = reg.get_by_id(aid)
                if rec is None:
                    continue
                meta = {
                    "source": rec.source_doc,
                    "article": rec.article_num,
                    "article_num": rec.article_num,
                    "article_id": rec.article_id,
                    "logical_article_id": rec.article_id,
                    "livre": rec.livre or "",
                    "titre": rec.titre or "",
                    "chapitre": rec.chapitre or "",
                    "page": rec.page_start or 0,
                    "source_doc": rec.source_doc,
                    "pdf_path": rec.pdf_path or "",
                    "url": rec.url_source or "",
                    "hierarchy_key": " > ".join(
                        x for x in (rec.livre, rec.titre, rec.chapitre, rec.article_num) if x
                    ),
                    "source_type": "pdf" if rec.pdf_path else "web",
                    "domaine": "",
                }
                if domaine and meta.get("domaine") == "":
                    pass
                out.append(LegalChunk(text=rec.full_text, metadata=meta, score=1.0))
            if out:
                return out
        except Exception as exc:  # noqa: BLE001
            log.debug("get_article SQLite : %s", exc)

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
            article_num_field = (meta or {}).get("article_num", "")
            if re.search(rf"\b{numero}\b", f"{article_field} {article_num_field}"):
                chunks.append(LegalChunk(text=text, metadata=meta or {}, score=1.0))
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
