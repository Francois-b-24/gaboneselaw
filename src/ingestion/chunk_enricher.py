"""Enrichissement des chunks : résumé + questions hypothétiques (Claude Haiku)."""

from __future__ import annotations

import json
import logging
import os
import re
from typing import Any

from anthropic import Anthropic

from src.config import ANTHROPIC_API_KEY, ANTHROPIC_MODEL_FALLBACK

log = logging.getLogger(__name__)

# Accolades doublées : sinon str.format interprète "summary" / "questions" comme des champs.
_ENRICH_PROMPT = """Tu indexes un extrait juridique. Réponds UNIQUEMENT en JSON valide :
{{"summary": "1 à 2 phrases en français", "questions": ["question 1", "question 2", "question 3"]}}
Les questions sont formulées comme un citoyen les poserait (3 à 5 entrées).
Extrait :
---
{text}
---
"""


def enrich_chunk(text: str, *, max_chars: int = 8000) -> dict[str, Any]:
    """Retourne summary + questions ; valeurs vides si pas de clé API ou erreur."""
    if os.getenv("RAG_SKIP_ENRICH", "0").strip() in ("1", "true", "yes"):
        return {"summary": "", "questions": []}
    if not ANTHROPIC_API_KEY:
        return {"summary": "", "questions": []}
    snippet = text[:max_chars]
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    try:
        msg = client.messages.create(
            model=ANTHROPIC_MODEL_FALLBACK,
            max_tokens=512,
            temperature=0.2,
            messages=[{"role": "user", "content": _ENRICH_PROMPT.format(text=snippet)}],
        )
        raw = ""
        for block in msg.content:
            if hasattr(block, "text"):
                raw += block.text
        raw = raw.strip()
        raw_json = raw
        if "```" in raw:
            fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", raw, re.IGNORECASE)
            if fence:
                raw_json = fence.group(1).strip()
        m = re.search(r"\{[\s\S]*\}", raw_json)
        if not m:
            return {"summary": "", "questions": []}
        try:
            data = json.loads(m.group())
        except json.JSONDecodeError:
            try:
                data = json.loads(m.group().replace("'", '"'))
            except json.JSONDecodeError:
                return {"summary": "", "questions": []}
        qs = data.get("questions") or []
        if not isinstance(qs, list):
            qs = []
        qs = [str(q).strip() for q in qs if str(q).strip()][:5]
        summary = str(data.get("summary", "")).strip()
        return {"summary": summary, "questions": qs}
    except Exception as exc:  # noqa: BLE001
        log.warning("enrich_chunk échoué : %s", exc)
        return {"summary": "", "questions": []}


def questions_embedding_text(enrich: dict[str, Any]) -> str:
    """Texte concaténé pour le 2e vecteur (questions + résumé)."""
    parts = []
    if enrich.get("summary"):
        parts.append(enrich["summary"])
    parts.extend(enrich.get("questions") or [])
    return "\n".join(parts).strip() or " "
