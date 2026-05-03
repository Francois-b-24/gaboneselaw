# Audit pipeline RAG — état des lieux et refonte

**Date** : 2026-05-03  
**Périmètre** : backend Python (`src/`), FastAPI [`webapp/main.py`](../main.py), données [`data/`](../../data/), Chroma persistant [`chroma_db/`](../../chroma_db/) (runtime).  
**Hors périmètre** : composants React, routing Next.js, design UI (sauf extension JSON optionnelle consommée plus tard).

---

## 1. Arborescence pertinente

```
first/
├── data/
│   ├── pdfs/
│   │   ├── manifest.yaml          # file, domaine, source, …
│   │   └── *.pdf
│   ├── web_sources.yaml           # url, domaine, discover_pdfs, …
│   ├── sources.db                 # [NOUVEAU] registre SQLite articles
│   └── audit_rag.db               # [NOUVEAU] logs audit RAG (optionnel)
├── chroma_db/                     # persistance Chroma (gitignored en prod)
├── scripts/
│   └── reindex.py                 # [NOUVEAU] réindexation contrôlée
├── src/
│   ├── config.py                  # env, CHROMA_PATH, COLLECTION_NAME, TOP_K, …
│   ├── agent/
│   │   ├── agent.py               # LegalAgent.answer → boucle outils
│   │   ├── tool_executor.py       # recherche_juridique, lire_article, …
│   │   ├── tools.py               # schémas OpenAI-style tools
│   │   ├── prompts.py             # SYSTEM_PROMPT, format_context
│   │   └── …
│   ├── rag/
│   │   ├── ingest.py              # ingestion unifiée (destructive recreate)
│   │   ├── retriever.py           # LegalRetriever, LegalChunk
│   │   ├── embeddings.py          # E5EmbeddingFunction, embed_query
│   │   ├── upload_indexer.py      # PDF upload → collection jetable
│   │   └── loaders/
│   │       ├── pdf_loader.py      # pypdf + split_by_chars
│   │       ├── web_loader.py      # BeautifulSoup + split_by_chars
│   │       └── splitter.py        # CHUNK_MAX_CHARS
│   ├── storage/                   # [NOUVEAU] source_registry
│   ├── ingestion/                 # [NOUVEAU] parsers, enricher, pipeline
│   ├── retrieval/                 # [NOUVEAU] hybrid, rewriter, fetcher
│   ├── generation/                # [NOUVEAU] citations, validateur
│   └── evaluation/                # [NOUVEAU] ragas_eval
└── webapp/
    ├── main.py                    # POST /api/chat, SSE, upload, …
    └── frontend/…                 # proxy /api/chat (inchangé si JSON rétrocompatible)
```

---

## 2. Flux de données (actuel → cible)

### Actuel

1. `python -m src.rag.ingest` ou bootstrap `webapp` si collection vide : lit `manifest.yaml` + `web_sources.yaml`.
2. PDF : `parse_pdf` (pypdf) → pages → `split_by_chars` (≈1200 car.) → `collection.add` avec métadonnées `article: "page N"`.
3. Web : `parse_web` (requests + BS4) → `split_by_chars` → idem.
4. Chat : `LegalAgent` → outil `recherche_juridique` → `LegalRetriever.search` (dense seul, filtre `domaine`) → `format_context` → LLM.
5. Réponse HTTP JSON : `answer`, `sources[]` { `citation`, `text`, `score`, `badge` }, `session_id`, `tools_used`, `source_stats`, `quality`.

### Cible (spec)

1. Parsing juridique hiérarchique + unité article ; tableaux camelot ; métadonnées riches + `article_id`.
2. Registre SQLite `articles` (texte intégral, navigation) ; Chroma pour vecteurs (dont option **deux collections** content / questions).
3. Enrichissement Haiku (résumé + questions) ; embeddings **BAAI/bge-m3** (configurable via valeur de `EMBEDDING_MODEL`).
4. Retrieval hybride : dense ×2 + BM25 + RRF + reranker optionnel ; multi-query rewriter.
5. Réponse : champs existants + **`citations`** optionnel validées (`rapidfuzz`).

---

## 3. Modules à modifier

| Fichier | Raison |
|---------|--------|
| [`src/config.py`](../../src/config.py) | Ajouter chemins `SOURCES_DB_PATH`, flags `USE_HYBRID_RAG`, `RAG_RERANKER`, collections questions, modèle reranker — **sans renommer** les variables existantes. |
| [`src/rag/ingest.py`](../../src/rag/ingest.py) | Déléguer à pipeline légal ou conserver chemin legacy ; éviter perte de données : `reindex.py` documenté comme entrée principale. |
| [`src/rag/retriever.py`](../../src/rag/retriever.py) | `search()` / `get_article()` : implémentation hybride + fetch SQLite derrière signatures stables. |
| [`src/rag/embeddings.py`](../../src/rag/embeddings.py) | Détection modèle BGE vs E5 (préfixes query différents). |
| [`src/agent/prompts.py`](../../src/agent/prompts.py) | Optionnel : enrichir `format_context` avec `article_id` / hiérarchie si présents en métadonnées. |
| [`webapp/main.py`](../main.py) | Ajouter `citations` au JSON chat ; `GET /api/sources/{article_id}` ; `GET /api/sources/{article_id}/pdf` ; persistance audit. |
| [`requirements.txt`](../../requirements.txt) | Nouvelles libs listées section 7. |

---

## 4. Modules à ajouter (spec)

- `src/ingestion/pdf_legal_parser.py` — pdfplumber + regex hiérarchie + camelot optionnel.
- `src/ingestion/web_scraper.py` — trafilatura + chunking juridique / paragraphe.
- `src/ingestion/chunk_enricher.py` — Haiku : résumé + questions.
- `src/ingestion/pipeline.py` — orchestration ingest → SQLite + Chroma.
- `src/storage/source_registry.py` — CRUD SQLite `articles`.
- `src/retrieval/hybrid_search.py` — Chroma + BM25 + RRF + reranker.
- `src/retrieval/query_rewriter.py` — multi-query + intention (Claude).
- `src/retrieval/source_fetcher.py` — `get_article_by_id`, `get_article_full_text`, `get_article_context`, `get_article_pdf_link`.
- `src/generation/answer_builder.py` — prompt strict + JSON citations.
- `src/generation/citation_validator.py` — SQLite + rapidfuzz ≥ 90 %.
- `src/evaluation/ragas_eval.py` — dataset + métriques Ragas (exécution manuelle).
- `scripts/reindex.py` — réindexation complète non destructive des sources.
- `CHANGELOG_RAG.md` — journal des changements RAG.

---

## 5. Contrats d’interface à préserver

### Python

- `LegalRetriever.search(query, domaine=None, k=TOP_K, include_uploads=False) -> list[LegalChunk]`
- `LegalRetriever.get_article(article, domaine=None) -> list[LegalChunk]`
- `LegalChunk(text, metadata, score)` ; propriété `citation` inchangée pour le frontend.
- `execute_tool(..., retriever, ...)` signatures inchangées.

### JSON `POST /api/chat` (et événement SSE `done`)

**Existant (à conserver)** : `session_id`, `answer`, `sources`, `tools_used`, `source_stats`, `quality`.

**Extension rétrocompatible** : `citations` : `null` ou liste d’objets :

```json
{
  "marker": "[1]",
  "article_id": "CGI_GAB_ART_11",
  "article_num": "Article 11",
  "source_doc": "CGI_Gabon_2024.pdf",
  "page": 8,
  "excerpt": "…",
  "hierarchy": "Livre I > Titre II",
  "url_source": null,
  "verified": true,
  "warning": null
}
```

### Variables d’environnement

Ne pas renommer : `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `ANTHROPIC_MODEL_FALLBACK`, `CHROMA_PATH` (dérivé du code), `NEXT_PUBLIC_API_BASE_URL`, `FRONTEND_ORIGINS`, `REDIS_URL`, etc.

**Ajouts** : par ex. `SOURCES_DB_PATH`, `USE_HYBRID_RAG`, `RAG_DUAL_COLLECTION`, `RAG_RERANKER`, `RAG_STRUCTURED_CITATIONS`, `AUDIT_RAG_DB_PATH`.

---

## 6. ChromaDB : stratégie double vecteur

Chroma associe **un** vecteur par document.

**Recommandation** : deux collections synchronisées :

- `{COLLECTION_NAME}` — documents = texte chunk ; métadonnées incluent `chunk_uid`, `article_id`, `vector_type: "content"`.
- `{COLLECTION_NAME}_questions` — même `chunk_uid` ; texte = résumé + questions concaténés pour embedding ; `vector_type: "questions"`.

Recherche : deux `query` top-k, fusion **RRF** (k=60) avec résultats BM25, puis reranker optionnel sur texte concaténé.

---

## 7. Dépendances

| Déjà présent (`requirements.txt`) | Rôle |
|-------------------------------------|------|
| chromadb, sentence-transformers | Vecteurs + modèle dense |
| pypdf, requests, beautifulsoup4 | Legacy PDF / web |
| anthropic, fastapi, pyyaml | LLM + API + manifests |

| À ajouter | Justification (1 phrase) |
|-----------|---------------------------|
| pdfplumber | Mise en page et texte ligne par ligne plus fiable que seul pypdf pour détecter titres/articles. |
| camelot-py[cv] (ou dependency optionnelle) | Extraction tabulaire des barèmes PDF ; peut échouer sur PDFs scannés — fallback sans table. |
| trafilatura | Contenu principal propre depuis HTML (spec scraping). |
| rank-bm25 | Sparse retrieval pour requêtes type « Article 234 ». |
| rapidfuzz | Validation sous-chaîne excerpt vs `full_text` à seuil 90 %. |
| ragas | Évaluation offline context_precision / recall / faithfulness / answer_relevancy. |
| tiktoken (optionnel) | Comptage tokens proche OpenAI pour limite 1500 tokens / article. |

**Note** : `camelot-py` impose souvent Ghostscript/OpenCV ; en CI ou environnement minimal, rendre l’import optionnel et documenter l’installation.

---

## 8. Points de risque

- **Latence / coût** : enrichissement Haiku par chunk + multi-query + reranker → prévoir flags désactivation et batching.
- **`lire_article`** : aujourd’hui regex sur `article` « page N » ; après refonte, résolution via `article_num` / `article_id` dans SQLite.
- **Uploads** : collection `droit_gabonais_uploads` peut rester sur parser simple jusqu’à alignement ultérieur.
- **Non-destructif** : `ingest.main()` historique supprime la collection ; **`scripts/reindex.py`** doit documenter sauvegarde `chroma_db` + rebuild depuis `sources.db` + fichiers sources.

---

## 9. Validation

Ce document constitue la **ligne de base** approuvée pour l’implémentation modulaire décrite dans le plan projet ; toute évolution majeure du schéma `articles` ou des collections Chroma doit mettre à jour ce fichier et `CHANGELOG_RAG.md`.
