"""Construction de réponses ancrées citations (prompt strict — optionnel)."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from anthropic import Anthropic

from src.config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL_FALLBACK
from src.agent.prompts import format_context
from src.rag.retriever import LegalChunk

log = logging.getLogger(__name__)

_SYSTEM = """Tu es un assistant fiscal gabonais. Tu réponds UNIQUEMENT à partir des extraits fournis.
Règles :
1. Chaque affirmation factuelle doit porter une citation [1], [2], … renvoyant aux extraits numérotés.
2. Si l'information manque dans les extraits, dis-le explicitement.
3. Réponds en français, sans markdown.
4. Réponds par un JSON {"answer": "...", "citations_used": [1,2]} listant les numéros d'extraits réellement utilisés."""


def build_answer_json_from_chunks(question: str, chunks: list[LegalChunk]) -> dict[str, Any] | None:
    """Appel LLM unique : JSON answer + liste d'indices d'extraits utilisés."""
    if not ANTHROPIC_API_KEY or not chunks:
        return None
    ctx = format_context(chunks)
    user = f"Question : {question}\n\nExtraits :\n{ctx}"
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    try:
        msg = client.messages.create(
            model=ANTHROPIC_MODEL_FALLBACK,
            max_tokens=2048,
            temperature=0.1,
            system=_SYSTEM,
            messages=[{"role": "user", "content": user}],
        )
        raw = ""
        for block in msg.content:
            if hasattr(block, "text"):
                raw += block.text
        m = re.search(r"\{[\s\S]*\}", raw)
        if not m:
            return None
        return json.loads(m.group())
    except Exception as exc:  # noqa: BLE001
        log.warning("answer_builder: %s", exc)
        return None


