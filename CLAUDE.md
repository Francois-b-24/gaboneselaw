# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Agent **"Info Juridique Citoyenne"** — a Streamlit app that vulgarizes Gabonese law (labor, land, family) for citizens. **Agentic RAG with tool use** over a markdown legal corpus, LLM via Groq for generation. Primary working language of the project and its users is **French**.

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

**Agentic tool-use loop**: the LLM decides which tools to call, executes them, and loops until it produces a text answer. Wired together in `src/agent/agent.py` (`LegalAgent.answer`) and consumed by `app.py`.

### Agent tools (`src/agent/tools.py`)

| Tool | Purpose | Implementation |
|------|---------|----------------|
| `recherche_juridique` | Semantic search in the legal corpus | `LegalRetriever.search()` |
| `lire_article` | Read a specific article by number | `LegalRetriever.get_article()` |
| `calculer_indemnite` | Compute severance/notice (Art. 72 & 75) | `src/agent/calculator.py` |

Tool definitions live in `src/agent/tools.py` (OpenAI/Groq JSON schemas). Execution dispatch is in `src/agent/tool_executor.py`. Adding a new tool means: (1) add schema to `tools.py`, (2) add execution branch to `tool_executor.py`, (3) mention it in the system prompt.

### Data flow (one user question)

1. **`app.py`** captures the question + selected `domaine` filter + full chat history from `st.session_state.messages`.
2. **`LegalAgent.answer`** (`src/agent/agent.py`) builds the message list `[system_prompt, *history, user_question]` and enters the **agent loop**.
3. **Agent loop** (`_agent_loop`): calls `GroqLLM.stream_with_tools()` with `tools=ALL_TOOLS`. Inspects the stream:
   - If `delta.tool_calls` → accumulates JSON args, executes tools via `tool_executor.execute_tool()`, appends results as `role: tool` messages, loops back.
   - If `delta.content` → yields tokens to `app.py` (streaming), loop ends.
   - Max `MAX_AGENT_ITERATIONS` rounds (default 5).
4. **`AgentResponse`** (`src/agent/response.py`) wraps the generator — iterable for `st.write_stream`, collects sources in `.sources`.
5. **`app.py`** renders tokens with `st.write_stream(response)` and displays `response.sources` in the expander.

### Key design points (don't break these)

- **e5 embedding prefixes are load-bearing.** `intfloat/multilingual-e5-base` requires `passage: ` at indexing time and `query: ` at search time. `E5EmbeddingFunction` (passed to Chroma) uses `passage:`; `embed_query()` is called explicitly in `LegalRetriever.search` to apply `query:`. Do **not** route queries through the Chroma embedding function — that would prefix them with `passage:` and silently degrade retrieval.

- **Groq model fallback.** `GROQ_MODEL` (default `llama-3.3-70b-versatile`) can disappear from Groq's catalog. `GroqLLM.stream_with_tools` catches the first failure and retries once with `GROQ_MODEL_FALLBACK` (`llama-3.1-8b-instant`). Keep this fallback path intact.

- **Domain filter is metadata-based.** Each chunk is tagged with `domaine` (`travail` / `foncier` / `famille`) during ingestion. The sidebar radio in `app.py` maps user-friendly labels to these keys via `DOMAINE_CHOICES`. Adding a new domain means: (1) new `.md` file in `data/legal_corpus/`, (2) new entry in `DOMAINES` in `src/config.py`, (3) re-run `ingest`.

- **Ingestion is idempotent but destructive.** `src/rag/ingest.py` deletes and recreates the collection on every run. Markdown files are split on `## Article` headers (regex `ARTICLE_SPLIT_RE`). Any file whose stem is not in `DOMAINES` is skipped with a log line — this is intentional.

- **System prompt enforces non-negotiable rules** (`src/agent/prompts.py`, `SYSTEM_PROMPT`): answer only from provided context, cite every claim as `[Source : <code>, <article>]`, admit when out-of-scope, always close with the legal disclaimer. If you change prompt behavior, preserve these four invariants — this is a legal-information tool.

- **Streamlit caching.** `get_agent()` uses `@st.cache_resource` so the sentence-transformers model and Chroma client are loaded once per session. Don't instantiate `LegalAgent` / `LegalRetriever` outside this cache in the UI layer.

### Config

All tunables live in `src/config.py` (env loaded from `.env` via `python-dotenv`): Groq model + fallback, embedding model, Chroma path/collection name, `TOP_K`, `CHUNK_MAX_CHARS`, `MAX_AGENT_ITERATIONS`, and the `DOMAINES` registry. Prefer editing this file over scattering constants.

## Corpus caveat

`data/legal_corpus/*.md` is a **hand-written demo corpus** with simplified article excerpts — not the authoritative text. The README and in-file warnings make this explicit. Do not treat article numbers or wording as citeable legal truth; they exist to validate the pipeline end-to-end.
