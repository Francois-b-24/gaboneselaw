"""Multi-query et extraction d'intention via Claude (Haiku)."""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

from anthropic import Anthropic

from src.config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL_FALLBACK

log = logging.getLogger(__name__)

_PROMPT = """Tu es un assistant pour la recherche juridique fiscale gabonaise.
À partir de la question utilisateur, produis UNIQUEMENT un JSON valide :
{{
  "queries": ["reformulation 1", "reformulation 2", "reformulation 3"],
  "intent": "définition|calcul|procédure|taux|autre",
  "entities": {{
    "articles": ["75 bis", "234"],
    "tax_types": ["IS", "TVA", "IR"],
    "years": ["2024"]
  }}
}}
Question :
---
{question}
---
"""


def rewrite_queries(question: str) -> dict[str, Any]:
    """Retourne dict queries (3), intent, entities ; fallback sur [question] seule."""
    if os.getenv("RAG_SKIP_REWRITER", "0").strip() in ("1", "true", "yes"):
        return {"queries": [question], "intent": "autre", "entities": {}}
    if not ANTHROPIC_API_KEY:
        return {"queries": [question], "intent": "autre", "entities": {}}
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    try:
        msg = client.messages.create(
            model=ANTHROPIC_MODEL_FALLBACK,
            max_tokens=512,
            temperature=0.1,
            messages=[{"role": "user", "content": _PROMPT.format(question=question)}],
        )
        raw = ""
        for block in msg.content:
            if hasattr(block, "text"):
                raw += block.text
        m = re.search(r"\{[\s\S]*\}", raw)
        if not m:
            return {"queries": [question], "intent": "autre", "entities": {}}
        data = json.loads(m.group())
        qs = data.get("queries") or []
        if not isinstance(qs, list) or len(qs) < 1:
            qs = [question]
        qs = [str(q).strip() for q in qs[:3] if str(q).strip()]
        while len(qs) < 3:
            qs.append(question)
        return {
            "queries": qs[:3],
            "intent": str(data.get("intent", "autre")),
            "entities": data.get("entities") if isinstance(data.get("entities"), dict) else {},
        }
    except Exception as exc:  # noqa: BLE001
        log.warning("rewrite_queries: %s", exc)
        return {"queries": [question], "intent": "autre", "entities": {}}
