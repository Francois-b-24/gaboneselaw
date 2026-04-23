# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Agent **"Info Juridique Citoyenne"** — a Streamlit app that vulgarizes Gabonese law (labor, land, family) for citizens. **Agentic RAG with tool use** over a corpus of PDFs and scraped web pages, LLM via Groq for generation. Primary working language of the project and its users is **French**.

## Commands

```bash
# Setup
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then set GROQ_API_KEY

# (Re)build the vector index — required before first run and after any change to
# data/pdfs/ or data/web_sources.yaml
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

**Agentic tool-use loop**: the LLM decides which tools to call, executes them, and loops until it produces a text answer. Wired together in `src/agent/agent.py` (`LegalAgent.answer`) and consumed by `app.py`.

### Agent tools (`src/agent/tools.py`)

| Tool | Purpose | Implementation |
|------|---------|----------------|
| `recherche_juridique` | Semantic search in the legal corpus | `LegalRetriever.search()` |
| `lire_article` | Read a specific article by number | `LegalRetriever.get_article()` |
| `calculer_indemnite` | Compute severance/notice (Art. 72 & 75) | `src/agent/calculator.py` |
| `synthese_document` | Summarize retrieved extracts on a topic | `src/agent/synthesizer.py` |
| `generer_rapport` | Generate a structured markdown report | `src/agent/synthesizer.py` |

Tool definitions live in `src/agent/tools.py` (OpenAI/Groq JSON schemas). Execution dispatch is in `src/agent/tool_executor.py`. Adding a new tool means: (1) add schema to `tools.py`, (2) add execution branch to `tool_executor.py`, (3) mention it in the system prompt.

`synthese_document` and `generer_rapport` are dual-use: the LLM can call them mid-loop, **and** `app.py` exposes them directly as "Synthétiser" / "Générer un rapport" buttons under the last assistant message. Both paths go through `src/agent/synthesizer.py`.

### Corpus sources

The corpus is built from **two source types**, both indexed into the same Chroma collection `droit_gabonais` and distinguished by the metadata field `source_type`:

- **PDFs** (`data/pdfs/*.pdf`) — authoritative documents (codes, JO, doctrine). Each PDF must have a matching entry in `data/pdfs/manifest.yaml` mapping it to a `domaine` and a human-readable `source` label. PDFs without a manifest entry are skipped.
- **Web pages** (`data/web_sources.yaml`) — list of URLs scraped at ingestion time. Each entry declares `url`, `domaine`, and `source`. The loader extracts the `<main>`/`<article>`/body text, strips nav/script/footer, and chunks.

A third, ephemeral source: **user-uploaded PDFs** via the Streamlit sidebar. Indexed into a separate collection `droit_gabonais_uploads` (recreated on every upload) and merged into retriever results when `include_uploads=True`.

### Data flow (one user question)

1. **`app.py`** captures the question + selected `domaine` filter + full chat history from `st.session_state.messages`, plus an `include_uploads` flag if the user has a PDF attached.
2. **`LegalAgent.answer`** (`src/agent/agent.py`) builds the message list `[system_prompt, *history, user_question]` and enters the **agent loop**.
3. **Agent loop** (`_agent_loop`): calls `GroqLLM.stream_with_tools()` with `tools=ALL_TOOLS`. Inspects the stream:
   - If `delta.tool_calls` → accumulates JSON args, executes tools via `tool_executor.execute_tool()` (passing `llm` + `include_uploads`), appends results as `role: tool` messages, loops back.
   - If `delta.content` → yields tokens to `app.py` (streaming), loop ends.
   - Max `MAX_AGENT_ITERATIONS` rounds (default 5).
4. **`AgentResponse`** (`src/agent/response.py`) wraps the generator — iterable for `st.write_stream`, collects sources in `.sources`.
5. **`app.py`** renders tokens with `st.write_stream(response)` and displays `response.sources` in the expander. The "Aller plus loin" panel (Synthétiser / Générer un rapport / Télécharger) appears under every assistant reply. If `response.sources` is empty (e.g. the LLM answered without calling `recherche_juridique`), `app.py` falls back to `agent.retriever.search(last_user_question, ...)` so the buttons still have chunks to work with — do not remove this fallback or the buttons become no-ops on tool-less replies.

### Key design points (don't break these)

- **e5 embedding prefixes are load-bearing.** `intfloat/multilingual-e5-base` requires `passage: ` at indexing time and `query: ` at search time. In `src/rag/embeddings.py`, `E5EmbeddingFunction` (passed to Chroma) uses `passage:`; `embed_query()` applies `query:` and is called explicitly in `LegalRetriever.search`. Do **not** route queries through the Chroma embedding function — that would prefix them with `passage:` and silently degrade retrieval.

- **Groq model fallback.** `GROQ_MODEL` (default `llama-3.3-70b-versatile`) can disappear from Groq's catalog. `GroqLLM.stream_with_tools` catches the first failure and retries once with `GROQ_MODEL_FALLBACK` (`llama-3.1-8b-instant`). Keep this fallback path intact.

- **Domain filter is metadata-based.** Each chunk is tagged with `domaine` (`travail` / `foncier` / `famille`) during ingestion. The sidebar radio in `app.py` maps user-friendly labels to these keys via `DOMAINE_CHOICES`. Adding a new domain means: (1) new entry in `DOMAINES` in `src/config.py`, (2) PDFs in `data/pdfs/` + matching `manifest.yaml` entries, (3) re-run `ingest`.

- **Ingestion is idempotent but destructive.** `src/rag/ingest.py` deletes and recreates the main collection on every run. PDFs without a `manifest.yaml` entry, or with an unknown domain, are skipped with a log line — this is intentional.

- **Web scraping is defensive.** `parse_web()` never throws on network errors — it logs a warning and returns an empty list, so one broken URL doesn't break the whole ingestion pipeline. Only HTML content is supported; a PDF URL should be downloaded and placed in `data/pdfs/` with a manifest entry instead.

- **System prompt enforces non-negotiable rules** (`src/agent/prompts.py`, `SYSTEM_PROMPT`): answer only from provided context, cite every claim as `[Source : <code>, <article>]`, admit when out-of-scope, always close with the legal disclaimer. If you change prompt behavior, preserve these four invariants — this is a legal-information tool.

- **Streamlit caching + embedding warm-up.** `get_agent()` uses `@st.cache_resource` so the sentence-transformers model and Chroma client are loaded once per session, then immediately calls `embed_query("init")` to force the model into memory — this removes a multi-second cold start on the first real question. Don't instantiate `LegalAgent` / `LegalRetriever` outside this cache in the UI layer, and don't drop the warm-up.

### Config

All tunables live in `src/config.py` (env loaded from `.env` via `python-dotenv`): Groq model + fallback, embedding model, Chroma path + collection names (main + uploads), `PDF_DIR`, `PDF_MANIFEST_FILE`, `WEB_SOURCES_FILE`, `TOP_K`, `CHUNK_MAX_CHARS`, `MAX_AGENT_ITERATIONS`, and the `DOMAINES` registry. Prefer editing this file over scattering constants.

## Corpus caveat

The PDFs in `data/pdfs/` and the URLs in `data/web_sources.yaml` are the project's real sources — check each one against the authoritative published text before relying on it for a legal decision. The app explicitly warns users that it provides general legal information, not legal advice.
