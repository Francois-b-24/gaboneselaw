"""Site web professionnel FastAPI pour l'agent juridique gabonais."""

from __future__ import annotations

import json
import tempfile
import time
import uuid
from collections import Counter, defaultdict, deque
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

import chromadb
from redis import Redis
from redis.exceptions import RedisError
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field
from starlette.requests import Request

from src.agent.agent import LegalAgent
from src.agent.synthesizer import generer_rapport, markdown_to_pdf, synthese_document
from src.config import (
    ANTHROPIC_API_KEY,
    CHROMA_PATH,
    COLLECTION_NAME,
    DOMAINES,
    FRONTEND_ORIGINS,
    REDIS_URL,
    TOP_K,
)
from src.rag.retriever import LegalChunk
from src.rag.upload_indexer import clear_upload_collection, index_uploaded_pdf


BASE_DIR = Path(__file__).resolve().parent
LOG_DIR = BASE_DIR / "logs"
LOG_FILE = LOG_DIR / "requests.jsonl"
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_CALLS = 20
RATE_LIMIT_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
SESSION_TTL_SECONDS = 30 * 60
SESSION_MAX_MESSAGES = 30
SESSIONS: dict[str, dict[str, Any]] = {}
TOOL_LABELS = {
    "recherche_juridique": "Recherche juridique",
    "lire_article": "Lecture d'article",
    "calculer_indemnite": "Calcul indemnites",
    "synthese_document": "Synthese documentaire",
    "generer_rapport": "Generation de rapport",
    "recherche_juridique_fallback": "Recherche fallback",
}


def _parse_allowed_origins(raw: str) -> list[str]:
    values = [origin.strip() for origin in raw.split(",")]
    return [origin for origin in values if origin]


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str = Field(min_length=3)
    domaine: str | None = None
    history: list[ChatMessage] = Field(default_factory=list)
    include_uploads: bool = False
    session_id: str | None = None


class SynthesisRequest(BaseModel):
    question: str = Field(min_length=3)
    domaine: str | None = None
    include_uploads: bool = False
    focus: str | None = None


class ReportRequest(BaseModel):
    question: str = Field(min_length=3)
    domaine: str | None = None
    include_uploads: bool = False


class SessionClearRequest(BaseModel):
    session_id: str | None = None


def _source_badge_type(chunk: LegalChunk) -> str:
    stype = chunk.metadata.get("source_type")
    if stype == "pdf_upload":
        return "Document uploadé"
    if stype == "web":
        return "Web"
    if stype == "pdf":
        return "PDF"
    return "Source"


def _chunk_to_dict(chunk: LegalChunk) -> dict[str, Any]:
    return {
        "citation": chunk.citation,
        "text": chunk.text,
        "score": round(chunk.score, 3),
        "badge": _source_badge_type(chunk),
    }


def _source_summary(chunks: list[LegalChunk]) -> dict[str, Any]:
    if not chunks:
        return {"count": 0, "avg_score": 0.0, "types": {}}
    types = Counter((c.metadata.get("source_type") or "unknown") for c in chunks)
    avg_score = sum(c.score for c in chunks) / len(chunks)
    return {
        "count": len(chunks),
        "avg_score": round(avg_score, 3),
        "types": dict(types),
    }


def _check_rate_limit(request: Request, scope: str) -> None:
    key = f"{scope}:{request.client.host if request.client else 'unknown'}"
    redis_client = get_redis_client()
    if redis_client is not None:
        _check_rate_limit_redis(redis_client, key)
        return
    _check_rate_limit_memory(key)


def _check_rate_limit_memory(key: str) -> None:
    now = time.time()
    bucket = RATE_LIMIT_BUCKETS[key]
    while bucket and now - bucket[0] > RATE_LIMIT_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT_MAX_CALLS:
        raise HTTPException(
            status_code=429,
            detail="Trop de requetes en peu de temps. Veuillez patienter une minute.",
        )
    bucket.append(now)


def _check_rate_limit_redis(redis_client: Redis, key: str) -> None:
    window_id = int(time.time() // RATE_LIMIT_WINDOW_SECONDS)
    redis_key = f"rl:{key}:{window_id}"
    try:
        count = int(redis_client.incr(redis_key))
        if count == 1:
            redis_client.expire(redis_key, RATE_LIMIT_WINDOW_SECONDS + 2)
        if count > RATE_LIMIT_MAX_CALLS:
            raise HTTPException(
                status_code=429,
                detail="Trop de requetes en peu de temps. Veuillez patienter une minute.",
            )
    except RedisError:
        # En cas de panne Redis, on bascule automatiquement sur le mode mémoire.
        _check_rate_limit_memory(key)


def _build_sse_event(event: str, data: dict[str, Any]) -> str:
    payload = json.dumps(data, ensure_ascii=True)
    return f"event: {event}\ndata: {payload}\n\n"


def _resolve_session_id(session_id: str | None) -> str:
    return session_id or uuid.uuid4().hex


def _prune_expired_sessions() -> None:
    now = time.time()
    expired = [
        sid
        for sid, data in SESSIONS.items()
        if now - float(data.get("updated_at", 0.0)) > SESSION_TTL_SECONDS
    ]
    for sid in expired:
        SESSIONS.pop(sid, None)


def _session_history(session_id: str) -> list[dict[str, str]]:
    redis_client = get_redis_client()
    if redis_client is not None:
        return _session_history_redis(redis_client, session_id)
    _prune_expired_sessions()
    payload = SESSIONS.get(session_id)
    if not payload:
        return []
    history = payload.get("history", [])
    if not isinstance(history, list):
        return []
    return [m for m in history if isinstance(m, dict)]


def _save_session_turn(session_id: str, user_text: str, assistant_text: str) -> None:
    redis_client = get_redis_client()
    if redis_client is not None:
        _save_session_turn_redis(redis_client, session_id, user_text, assistant_text)
        return
    _save_session_turn_memory(session_id, user_text, assistant_text)


def _save_session_turn_memory(session_id: str, user_text: str, assistant_text: str) -> None:
    history = _session_history(session_id)
    history.append({"role": "user", "content": user_text})
    history.append({"role": "assistant", "content": assistant_text})
    SESSIONS[session_id] = {
        "history": history[-SESSION_MAX_MESSAGES:],
        "updated_at": time.time(),
    }


@lru_cache(maxsize=1)
def get_redis_client() -> Redis | None:
    if not REDIS_URL:
        return None
    try:
        client = Redis.from_url(REDIS_URL, decode_responses=True)
        client.ping()
        return client
    except RedisError:
        return None


def _session_key(session_id: str) -> str:
    return f"session:{session_id}"


def _session_history_redis(redis_client: Redis, session_id: str) -> list[dict[str, str]]:
    try:
        payload = redis_client.get(_session_key(session_id))
    except RedisError:
        return []
    if not payload:
        return []
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return []
    history = data.get("history", [])
    if not isinstance(history, list):
        return []
    return [m for m in history if isinstance(m, dict)]


def _save_session_turn_redis(
    redis_client: Redis,
    session_id: str,
    user_text: str,
    assistant_text: str,
) -> None:
    history = _session_history_redis(redis_client, session_id)
    history.append({"role": "user", "content": user_text})
    history.append({"role": "assistant", "content": assistant_text})
    payload = json.dumps(
        {"history": history[-SESSION_MAX_MESSAGES:]},
        ensure_ascii=True,
    )
    try:
        redis_client.setex(_session_key(session_id), SESSION_TTL_SECONDS, payload)
    except RedisError:
        _save_session_turn_memory(session_id, user_text, assistant_text)


def _clear_session(session_id: str) -> None:
    redis_client = get_redis_client()
    if redis_client is not None:
        try:
            redis_client.delete(_session_key(session_id))
        except RedisError:
            pass
    SESSIONS.pop(session_id, None)


def _log_request(event: dict[str, Any]) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=True) + "\n")


def _read_logs(limit: int = 200) -> list[dict[str, Any]]:
    if not LOG_FILE.exists():
        return []
    lines = LOG_FILE.read_text(encoding="utf-8").splitlines()
    out: list[dict[str, Any]] = []
    for line in lines[-limit:]:
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def _admin_metrics() -> dict[str, Any]:
    rows = _read_logs()
    if not rows:
        return {
            "total_requests": 0,
            "avg_latency_ms": 0,
            "citation_rate": 0,
            "error_count": 0,
            "top_tools": {},
        }
    avg_latency = int(sum(r.get("latency_ms", 0) for r in rows) / len(rows))
    with_citation = sum(1 for r in rows if r.get("has_citation"))
    errors = sum(1 for r in rows if r.get("status") == "error")
    tools = Counter()
    for r in rows:
        for t in r.get("tools_used", []):
            tools[t] += 1
    return {
        "total_requests": len(rows),
        "avg_latency_ms": avg_latency,
        "citation_rate": round((with_citation / len(rows)) * 100, 1),
        "error_count": errors,
        "top_tools": dict(tools.most_common(8)),
    }


@lru_cache(maxsize=1)
def get_agent() -> LegalAgent:
    agent = LegalAgent()
    # Warm-up embeddings pour éviter le cold start.
    try:
        from src.rag.embeddings import embed_query

        embed_query("init")
    except Exception:
        pass
    return agent


def _ensure_prerequisites() -> None:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY manquante dans le fichier .env.")
    should_ingest = not Path(CHROMA_PATH).exists()
    if not should_ingest:
        try:
            client = chromadb.PersistentClient(path=CHROMA_PATH)
            collection = client.get_collection(COLLECTION_NAME)
            should_ingest = collection.count() == 0
        except Exception:
            should_ingest = True
    if should_ingest:
        from src.rag.ingest import main as ingest_main

        ingest_main()


def _fallback_sources(
    agent: LegalAgent,
    query: str,
    domaine: str | None,
    include_uploads: bool,
) -> list[LegalChunk]:
    try:
        return agent.retriever.search(
            query,
            domaine=domaine,
            k=TOP_K,
            include_uploads=include_uploads,
        )
    except Exception:
        return []


def _collect_answer_text(response) -> str:
    return "".join(token for token in response)


def _suggested_questions() -> list[dict[str, str]]:
    """Construit des questions frequentes ancrees sur les sources PDF indexees."""
    defaults = [
        {
            "question": "Quels sont mes droits en cas de licenciement sans preavis au Gabon ?",
            "domaine": "travail",
        },
        {
            "question": "Quelles demarches suivre pour obtenir un titre foncier au Gabon ?",
            "domaine": "foncier",
        },
        {
            "question": "Quelles sont les conditions du divorce par consentement mutuel ?",
            "domaine": "famille",
        },
        {
            "question": "Quelles formalites faut-il pour creer une SARL au Gabon ?",
            "domaine": "commercial",
        },
        {
            "question": "Comment contester une decision administrative au Gabon ?",
            "domaine": "administratif",
        },
        {
            "question": "Quelle est la procedure en cas d'infraction penale ?",
            "domaine": "penal",
        },
        {
            "question": "Comment regulariser une situation fiscale d'entreprise ?",
            "domaine": "fiscal",
        },
        {
            "question": "Quelles regles encadrent la protection des donnees personnelles au Gabon ?",
            "domaine": "numerique",
        },
    ]
    try:
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        collection = client.get_collection(COLLECTION_NAME)
        rows = collection.get(include=["metadatas"])
        metadatas = rows.get("metadatas", [])
        found_domains = {m.get("domaine") for m in metadatas if isinstance(m, dict)}
        return [q for q in defaults if q["domaine"] in found_domains] or defaults
    except Exception:
        return defaults


def _run_llm_diagnostics() -> dict[str, Any]:
    """Execute des checks rapides sur le moteur RAG/LLM."""
    checks: list[dict[str, Any]] = []
    ok = True

    # 1) Sante corpus
    collection_count = 0
    try:
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        collection = client.get_collection(COLLECTION_NAME)
        collection_count = int(collection.count())
        passed = collection_count > 0
        checks.append(
            {
                "name": "corpus_indexe",
                "passed": passed,
                "details": f"{collection_count} chunks dans la collection principale",
            }
        )
        ok = ok and passed
    except Exception as exc:  # noqa: BLE001
        checks.append(
            {
                "name": "corpus_indexe",
                "passed": False,
                "details": f"Erreur acces Chroma: {exc}",
            }
        )
        ok = False

    # 2) Retrieval travail
    agent = get_agent()
    retrieved = _fallback_sources(agent, "licenciement abusif", "travail", include_uploads=False)
    passed_retrieval = len(retrieved) > 0
    checks.append(
        {
            "name": "retrieval_travail",
            "passed": passed_retrieval,
            "details": f"{len(retrieved)} source(s) retrouvee(s) pour 'licenciement abusif'",
        }
    )
    ok = ok and passed_retrieval

    # 3) Reponse agentique + format
    try:
        response = agent.answer(
            question="Quelle est la duree du preavis apres 6 ans d'anciennete ?",
            domaine="travail",
            history=[],
            include_uploads=False,
        )
        answer = _collect_answer_text(response)
        sources = list(response.sources) or _fallback_sources(
            agent,
            "duree du preavis apres 6 ans d'anciennete",
            "travail",
            include_uploads=False,
        )
        has_sources = len(sources) > 0
        has_source_citation = "[Source :" in answer
        normalized = (
            answer.lower()
            .replace("é", "e")
            .replace("è", "e")
            .replace("à", "a")
            .replace("ù", "u")
        )
        has_disclaimer = (
            "information juridique generale" in normalized
            and "consultez un avocat" in normalized
        )

        checks.append(
            {
                "name": "agent_reponse",
                "passed": bool(answer.strip()),
                "details": f"Longueur reponse: {len(answer.strip())} caracteres",
            }
        )
        checks.append(
            {
                "name": "citations_format",
                "passed": has_source_citation,
                "details": "Presence du format [Source : ...] dans la reponse",
            }
        )
        checks.append(
            {
                "name": "disclaimer_final",
                "passed": has_disclaimer,
                "details": "Presence de l'avertissement juridique final",
            }
        )
        checks.append(
            {
                "name": "sources_collectees",
                "passed": has_sources,
                "details": f"{len(sources)} source(s) collectee(s) pour la question test",
            }
        )
        ok = ok and has_source_citation and has_disclaimer and has_sources
    except Exception as exc:  # noqa: BLE001
        checks.append(
            {
                "name": "agent_reponse",
                "passed": False,
                "details": f"Echec appel LLM/agent: {exc}",
            }
        )
        ok = False

    return {"ok": ok, "checks": checks}


app = FastAPI(title="Info Juridique Citoyenne — Web", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_allowed_origins(FRONTEND_ORIGINS),
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))


@app.on_event("startup")
def on_startup() -> None:
    _ensure_prerequisites()
    get_agent()


@app.get("/", response_class=HTMLResponse)
def index(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "index.html",
        {
            "domaines": [{"value": "", "label": "Tous les domaines"}]
            + [{"value": k, "label": v["label"]} for k, v in DOMAINES.items()],
        },
    )


@app.get("/outil", response_class=HTMLResponse)
def outil_info(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(request, "outil.html", {})


@app.get("/admin", response_class=HTMLResponse)
def admin_view(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        request,
        "admin.html",
        {
            "metrics": _admin_metrics(),
            "events": list(reversed(_read_logs(limit=50))),
            "tool_labels": TOOL_LABELS,
        },
    )


@app.post("/api/diagnostics/llm")
def api_diagnostics_llm() -> dict[str, Any]:
    return _run_llm_diagnostics()


@app.get("/api/suggested-questions")
def api_suggested_questions() -> dict[str, Any]:
    return {"questions": _suggested_questions()}


@app.post("/api/chat")
def api_chat(payload: ChatRequest, request: Request) -> dict[str, Any]:
    _check_rate_limit(request, "chat")
    started = time.time()
    agent = get_agent()
    session_id = _resolve_session_id(payload.session_id)
    history = [m.model_dump() for m in payload.history] or _session_history(session_id)
    try:
        response = agent.answer(
            question=payload.question,
            domaine=payload.domaine,
            history=history,
            include_uploads=payload.include_uploads,
        )
        answer = _collect_answer_text(response).strip()
        sources = list(response.sources)
        if not sources:
            sources = _fallback_sources(
                agent,
                payload.question,
                payload.domaine,
                payload.include_uploads,
            )
            if "recherche_juridique_fallback" not in response.tools_used:
                response.tools_used.append("recherche_juridique_fallback")
        source_stats = _source_summary(sources)
        has_citation = "[Source :" in answer
        latency_ms = int((time.time() - started) * 1000)
        _log_request(
            {
                "ts": datetime.now(timezone.utc).isoformat(),
                "path": "/api/chat",
                "status": "ok",
                "session_id": session_id,
                "question": payload.question,
                "domaine": payload.domaine,
                "tools_used": response.tools_used,
                "source_count": source_stats["count"],
                "has_citation": has_citation,
                "latency_ms": latency_ms,
                "ip": request.client.host if request.client else "unknown",
            }
        )
        _save_session_turn(session_id, payload.question, answer)
        return {
            "session_id": session_id,
            "answer": answer,
            "sources": [_chunk_to_dict(s) for s in sources],
            "tools_used": response.tools_used,
            "source_stats": source_stats,
            "quality": {
                "has_citation": has_citation,
                "has_disclaimer": "information juridique generale"
                in answer.lower().replace("é", "e"),
            },
        }
    except Exception as exc:  # noqa: BLE001
        _log_request(
            {
                "ts": datetime.now(timezone.utc).isoformat(),
                "path": "/api/chat",
                "status": "error",
                "session_id": session_id,
                "question": payload.question,
                "domaine": payload.domaine,
                "tools_used": [],
                "source_count": 0,
                "has_citation": False,
                "latency_ms": int((time.time() - started) * 1000),
                "ip": request.client.host if request.client else "unknown",
                "error": str(exc),
            }
        )
        raise


@app.post("/api/chat/stream")
def api_chat_stream(payload: ChatRequest, request: Request) -> StreamingResponse:
    _check_rate_limit(request, "chat")
    started = time.time()
    agent = get_agent()
    session_id = _resolve_session_id(payload.session_id)
    history = [m.model_dump() for m in payload.history] or _session_history(session_id)

    def event_stream():
        try:
            response = agent.answer(
                question=payload.question,
                domaine=payload.domaine,
                history=history,
                include_uploads=payload.include_uploads,
            )
            answer_parts: list[str] = []
            for token in response:
                answer_parts.append(token)
                yield _build_sse_event("token", {"token": token, "session_id": session_id})

            answer = "".join(answer_parts).strip()
            sources = list(response.sources)
            if not sources:
                sources = _fallback_sources(
                    agent,
                    payload.question,
                    payload.domaine,
                    payload.include_uploads,
                )
                if "recherche_juridique_fallback" not in response.tools_used:
                    response.tools_used.append("recherche_juridique_fallback")
            source_stats = _source_summary(sources)
            has_citation = "[Source :" in answer
            latency_ms = int((time.time() - started) * 1000)
            _save_session_turn(session_id, payload.question, answer)
            _log_request(
                {
                    "ts": datetime.now(timezone.utc).isoformat(),
                    "path": "/api/chat/stream",
                    "status": "ok",
                    "session_id": session_id,
                    "question": payload.question,
                    "domaine": payload.domaine,
                    "tools_used": response.tools_used,
                    "source_count": source_stats["count"],
                    "has_citation": has_citation,
                    "latency_ms": latency_ms,
                    "ip": request.client.host if request.client else "unknown",
                }
            )
            yield _build_sse_event(
                "done",
                {
                    "session_id": session_id,
                    "answer": answer,
                    "sources": [_chunk_to_dict(s) for s in sources],
                    "tools_used": response.tools_used,
                    "source_stats": source_stats,
                    "quality": {
                        "has_citation": has_citation,
                        "has_disclaimer": "information juridique generale"
                        in answer.lower().replace("é", "e"),
                    },
                },
            )
        except Exception as exc:  # noqa: BLE001
            _log_request(
                {
                    "ts": datetime.now(timezone.utc).isoformat(),
                    "path": "/api/chat/stream",
                    "status": "error",
                    "session_id": session_id,
                    "question": payload.question,
                    "domaine": payload.domaine,
                    "tools_used": [],
                    "source_count": 0,
                    "has_citation": False,
                    "latency_ms": int((time.time() - started) * 1000),
                    "ip": request.client.host if request.client else "unknown",
                    "error": str(exc),
                }
            )
            yield _build_sse_event(
                "error",
                {"message": "Erreur serveur lors du streaming.", "session_id": session_id},
            )

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/upload-pdf")
async def api_upload_pdf(request: Request, file: UploadFile = File(...)) -> dict[str, Any]:
    _check_rate_limit(request, "upload")
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés.")
    if file.content_type not in {"application/pdf", "application/x-pdf"}:
        raise HTTPException(status_code=400, detail="Type MIME invalide pour un PDF.")
    payload = await file.read()
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="PDF trop volumineux (max 15 MB).")
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(payload)
        tmp_path = Path(tmp.name)
    try:
        n_chunks = index_uploaded_pdf(tmp_path, file.filename)
    finally:
        tmp_path.unlink(missing_ok=True)
    return {
        "filename": file.filename,
        "chunks": n_chunks,
        "enabled": n_chunks > 0,
    }


@app.post("/api/clear-upload")
def api_clear_upload() -> dict[str, str]:
    clear_upload_collection()
    return {"status": "ok"}


@app.post("/api/session/clear")
def api_clear_session(request: Request, payload: SessionClearRequest) -> dict[str, Any]:
    _check_rate_limit(request, "chat")
    if not payload.session_id:
        return {"status": "noop", "cleared": False}
    _clear_session(payload.session_id)
    return {"status": "ok", "cleared": True, "session_id": payload.session_id}


@app.post("/api/synthesis")
def api_synthesis(payload: SynthesisRequest) -> dict[str, Any]:
    agent = get_agent()
    chunks = _fallback_sources(
        agent,
        payload.question,
        payload.domaine,
        payload.include_uploads,
    )
    text = synthese_document(chunks, payload.focus, agent.llm)
    return {
        "text": text,
        "sources": [_chunk_to_dict(s) for s in chunks],
    }


@app.post("/api/report")
def api_report(payload: ReportRequest) -> dict[str, Any]:
    agent = get_agent()
    chunks = _fallback_sources(
        agent,
        payload.question,
        payload.domaine,
        payload.include_uploads,
    )
    report_md = generer_rapport(payload.question, chunks, agent.llm)
    return {
        "markdown": report_md,
        "sources": [_chunk_to_dict(s) for s in chunks],
    }


@app.post("/api/report/pdf")
def api_report_pdf(payload: ReportRequest) -> Response:
    agent = get_agent()
    chunks = _fallback_sources(
        agent,
        payload.question,
        payload.domaine,
        payload.include_uploads,
    )
    report_md = generer_rapport(payload.question, chunks, agent.llm)
    pdf_bytes = markdown_to_pdf(report_md, title=payload.question)
    return Response(content=pdf_bytes, media_type="application/pdf")
