# Changelog — pipeline RAG

## 2026-05-03

### Ajouté

- `webapp/docs/RAG_AUDIT.md` : audit d’architecture et contrats d’interface.
- `src/storage/source_registry.py` : SQLite `articles` + `rag_chunks` (texte BM25).
- `src/storage/audit_rag.py` : journal `rag_audit` (question, reformulations, ids, citations validées, durée).
- `src/ingestion/pdf_legal_parser.py` : parsing hiérarchique pdfplumber (+ camelot optionnel).
- `src/ingestion/web_scraper.py` : scraping trafilatura + découpage juridique / paragraphes.
- `src/ingestion/chunk_enricher.py` : résumé + questions (Claude Haiku).
- `src/ingestion/pipeline.py` : orchestration ingest → SQLite + Chroma (+ collection questions si `RAG_DUAL_COLLECTION`).
- `src/retrieval/hybrid_search.py`, `query_rewriter.py`, `source_fetcher.py`.
- `src/generation/citation_validator.py`, `answer_builder.py`.
- `scripts/reindex.py` : réindexation contrôlée (`USE_LEGAL_PIPELINE=1`).
- `src/evaluation/ragas_eval.py` : stub + export JSONL minimal.
- Embeddings : support **BAAI/bge-m3** via valeur de `EMBEDDING_MODEL` (sans préfixe E5).
- FastAPI : `GET /api/sources/{article_id}`, `GET /api/sources/{article_id}/pdf` ; champ JSON optionnel **`citations`** sur `/api/chat` et événement SSE `done` (activer avec `RAG_STRUCTURED_CITATIONS=1`).

### Modifié

- `src/rag/ingest.py` : branche `USE_LEGAL_PIPELINE=1` → pipeline légal.
- `src/rag/retriever.py` : recherche hybride optionnelle (`USE_HYBRID_RAG`) ; `get_article` priorise SQLite.
- `src/config.py` : chemins `SOURCES_DB_PATH`, `AUDIT_RAG_DB_PATH`, flags RAG.

### Variables d’environnement (ajouts, sans renommage des existantes)

- `USE_LEGAL_PIPELINE`, `USE_HYBRID_RAG`, `RAG_DUAL_COLLECTION`, `RAG_RERANKER`, `RAG_STRUCTURED_CITATIONS`
- `SOURCES_DB_PATH`, `AUDIT_RAG_DB_PATH`, `RAG_SKIP_ENRICH`, `RAG_SKIP_REWRITER`, `RERANKER_MODEL`, `COLLECTION_NAME_QUESTIONS`

### Dépendances Python

- Voir `requirements.txt` : `pdfplumber`, `trafilatura`, `rank-bm25`, `rapidfuzz`, `ragas`, `datasets` (éval), `camelot-py` (optionnel tableaux).
