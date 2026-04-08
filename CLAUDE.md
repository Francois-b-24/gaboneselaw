# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Agent **"Info Juridique Citoyenne"** — a Streamlit app that vulgarizes Gabonese law (labor, land, family) for citizens. RAG pipeline over a markdown legal corpus, Mistral via Groq for generation. Primary working language of the project and its users is **French**.

## Commands

```bash
# Setup
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then set GROQ_API_KEY

# (Re)build the vector index — required before first run and after any change to data/legal_corpus/
python -m src.rag.ingest

# Run the app
streamlit run app.py
```

There is **no test suite, no linter, no build step**. Quick manual check of the retriever from a REPL:
```python
from src.rag.retriever import LegalRetriever
LegalRetriever().search("licenciement abusif", domaine="travail", k=3)
```

## Architecture

Three-layer pipeline: **RAG retrieval → prompt assembly → Groq streaming**, wired together in `src/agent/agent.py` (`LegalAgent.answer`) and consumed by `app.py`.

### Data flow (one user question)

1. **`app.py`** captures the question + selected `domaine` filter + full chat history from `st.session_state.messages`.
2. **`LegalAgent.answer`** (`src/agent/agent.py`) calls the retriever, then builds the OpenAI-format message list: `[system_prompt, *history, user_message_with_context]`.
3. **`LegalRetriever.search`** (`src/rag/retriever.py`) queries the persistent Chroma collection with an optional `where={"domaine": ...}` filter. Returns `LegalChunk` dataclasses (text + metadata + cosine-based score).
4. **`build_user_message`** (`src/agent/prompts.py`) injects the retrieved extracts into the user turn so citations stay grounded.
5. **`GroqLLM.stream`** (`src/agent/llm.py`) streams tokens; `app.py` renders them with `st.write_stream` and appends the sources expander.

### Key design points (don't break these)

- **e5 embedding prefixes are load-bearing.** `intfloat/multilingual-e5-base` requires `passage: ` at indexing time and `query: ` at search time. `E5EmbeddingFunction` (passed to Chroma) uses `passage:`; `embed_query()` is called explicitly in `LegalRetriever.search` to apply `query:`. Do **not** route queries through the Chroma embedding function — that would prefix them with `passage:` and silently degrade retrieval.

- **Groq model fallback.** `GROQ_MODEL` (default `mistral-saba-24b`) can disappear from Groq's catalog. `GroqLLM.stream` catches the first failure and retries once with `GROQ_MODEL_FALLBACK` (`llama-3.1-8b-instant`). Keep this fallback path intact.

- **Domain filter is metadata-based.** Each chunk is tagged with `domaine` (`travail` / `foncier` / `famille`) during ingestion. The sidebar radio in `app.py` maps user-friendly labels to these keys via `DOMAINE_CHOICES`. Adding a new domain means: (1) new `.md` file in `data/legal_corpus/`, (2) new entry in `DOMAINES` in `src/config.py`, (3) re-run `ingest`.

- **Ingestion is idempotent but destructive.** `src/rag/ingest.py` deletes and recreates the collection on every run. Markdown files are split on `## Article` headers (regex `ARTICLE_SPLIT_RE`). Any file whose stem is not in `DOMAINES` is skipped with a log line — this is intentional.

- **System prompt enforces non-negotiable rules** (`src/agent/prompts.py`, `SYSTEM_PROMPT`): answer only from provided context, cite every claim as `[Source : <code>, <article>]`, admit when out-of-scope, always close with the legal disclaimer. If you change prompt behavior, preserve these four invariants — this is a legal-information tool.

- **Streamlit caching.** `get_agent()` uses `@st.cache_resource` so the sentence-transformers model and Chroma client are loaded once per session. Don't instantiate `LegalAgent` / `LegalRetriever` outside this cache in the UI layer.

### Config

All tunables live in `src/config.py` (env loaded from `.env` via `python-dotenv`): Groq model + fallback, embedding model, Chroma path/collection name, `TOP_K`, `CHUNK_MAX_CHARS`, and the `DOMAINES` registry. Prefer editing this file over scattering constants.

## Corpus caveat

`data/legal_corpus/*.md` is a **hand-written demo corpus** with simplified article excerpts — not the authoritative text. The README and in-file warnings make this explicit. Do not treat article numbers or wording as citeable legal truth; they exist to validate the pipeline end-to-end.
