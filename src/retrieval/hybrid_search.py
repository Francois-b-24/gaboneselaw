"""Recherche hybride : Chroma dense + BM25 + RRF (+ reranker optionnel)."""

from __future__ import annotations

import logging
from typing import Any

import chromadb

from src.config import (
    CHROMA_PATH,
    COLLECTION_NAME,
    COLLECTION_NAME_QUESTIONS,
    RAG_DUAL_COLLECTION,
    RAG_RERANKER,
    RERANKER_MODEL,
    TOP_K,
    USE_HYBRID_RAG,
)
from src.rag.embeddings import E5EmbeddingFunction, embed_query
from src.rag.retriever import LegalChunk
from src.storage.source_registry import SourceRegistry

log = logging.getLogger(__name__)


def _rrf_merge(rank_lists: list[list[str]], k: int = 60) -> list[str]:
    scores: dict[str, float] = {}
    for ranks in rank_lists:
        for r, doc_id in enumerate(ranks):
            if not doc_id:
                continue
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + r + 1)
    return sorted(scores, key=lambda x: scores[x], reverse=True)


class HybridSearchEngine:
    def __init__(
        self,
        registry: SourceRegistry,
        collection_name: str = COLLECTION_NAME,
    ) -> None:
        self._registry = registry
        self._client = chromadb.PersistentClient(path=CHROMA_PATH)
        self._collection = self._client.get_collection(
            name=collection_name,
            embedding_function=E5EmbeddingFunction(prefix="passage: "),
        )
        self._q_collection = None
        if RAG_DUAL_COLLECTION:
            try:
                self._q_collection = self._client.get_collection(
                    name=COLLECTION_NAME_QUESTIONS,
                    embedding_function=E5EmbeddingFunction(prefix="passage: "),
                )
            except Exception:  # noqa: BLE001
                self._q_collection = None
        self._bm25 = None
        self._bm25_ids: list[str] = []
        self._reranker = None

    def _ensure_bm25(self) -> None:
        if self._bm25 is not None:
            return
        try:
            from rank_bm25 import BM25Okapi
        except ImportError:
            log.warning("rank_bm25 absent — BM25 désactivé.")
            self._bm25 = False
            return
        pairs = self._registry.iter_bm25_corpus()
        if not pairs:
            self._bm25 = False
            return
        self._bm25_ids = [p[0] for p in pairs]
        tokenized = [p[1].lower().split() for p in pairs]
        self._bm25 = BM25Okapi(tokenized)

    def _ensure_reranker(self) -> None:
        if self._reranker is not None or not RAG_RERANKER:
            return
        try:
            from sentence_transformers import CrossEncoder

            self._reranker = CrossEncoder(RERANKER_MODEL)
        except Exception as exc:  # noqa: BLE001
            log.warning("Reranker indisponible : %s", exc)
            self._reranker = False

    def search(
        self,
        query: str,
        domaine: str | None = None,
        k: int = TOP_K,
        extra_queries: list[str] | None = None,
    ) -> list[LegalChunk]:
        if not USE_HYBRID_RAG:
            raise RuntimeError("HybridSearchEngine.search appelé sans USE_HYBRID_RAG")
        queries = [query]
        if extra_queries:
            queries.extend(extra_queries)
        queries = list(dict.fromkeys(q.strip() for q in queries if q.strip()))[:5]

        where: dict[str, Any] | None = {"domaine": domaine} if domaine else None
        chroma_ids_ranked: list[str] = []
        for subq in queries:
            qemb = embed_query(subq)
            res = self._collection.query(
                query_embeddings=[qemb],
                n_results=30,
                where=where,
            )
            docs = res.get("ids", [[]])[0]
            chroma_ids_ranked.extend(docs)

        q_ids_ranked: list[str] = []
        if self._q_collection is not None:
            for subq in queries:
                qemb = embed_query(subq)
                res = self._q_collection.query(
                    query_embeddings=[qemb],
                    n_results=30,
                    where=where,
                )
                raw = res.get("ids", [[]])[0]
                q_ids_ranked.extend([x.replace("__q", "") for x in raw if x.endswith("__q")])

        self._ensure_bm25()
        bm25_rank: list[str] = []
        if self._bm25 and self._bm25 is not False:
            toks = query.lower().split()
            scores = self._bm25.get_scores(toks)  # type: ignore[union-attr]
            ranked_idx = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:30]
            bm25_rank = [self._bm25_ids[i] for i in ranked_idx if i < len(self._bm25_ids)]

        merged = _rrf_merge(
            [
                list(dict.fromkeys(chroma_ids_ranked)),
                list(dict.fromkeys(q_ids_ranked)) if q_ids_ranked else [],
                bm25_rank,
            ]
        )
        merged = list(dict.fromkeys(merged))[: max(40, k * 6)]

        if not merged:
            return []

        candidates: list[LegalChunk] = []
        batch_n = 80
        for start in range(0, len(merged), batch_n):
            batch_ids = merged[start : start + batch_n]
            try:
                got = self._collection.get(ids=batch_ids, include=["documents", "metadatas"])
            except Exception:
                continue
            docs = got.get("documents") or []
            metas = got.get("metadatas") or []
            ids_out = got.get("ids") or []
            for cid, text, meta in zip(ids_out, docs, metas):
                if text is None or cid is None:
                    continue
                try:
                    rank = merged.index(cid)
                except ValueError:
                    rank = 999
                score = max(0.05, 1.0 - rank / (len(merged) + 1))
                candidates.append(LegalChunk(text=text, metadata=meta or {}, score=score))

        if RAG_RERANKER and candidates:
            self._ensure_reranker()
            if self._reranker and self._reranker is not False:
                pairs = [[query, c.text[:2000]] for c in candidates]
                scores = self._reranker.predict(pairs)
                for c, s in zip(candidates, scores):
                    c.score = float(s)
                candidates.sort(key=lambda x: x.score, reverse=True)

        candidates.sort(key=lambda x: x.score, reverse=True)
        return candidates[:k]
