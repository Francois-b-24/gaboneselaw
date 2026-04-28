"""Services pédagogiques (cours, QCM, correction guidée)."""

from __future__ import annotations

import json
import time
import uuid
from collections import Counter
from dataclasses import dataclass
from threading import Lock
from typing import Any

from src.agent.llm import AnthropicLLM
from src.agent.prompts import (
    CORRECTION_PROMPT,
    EXERCISE_PROMPT,
    LESSON_PROMPT,
    build_correction_message,
    build_exercise_message,
    build_lesson_message,
    format_context,
)
from src.config import TOP_K
from src.rag.retriever import LegalChunk, LegalRetriever


def _source_badge_type(chunk: LegalChunk) -> str:
    stype = chunk.metadata.get("source_type")
    if stype == "pdf_upload":
        return "Document uploade"
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


def _collect_stream(llm: AnthropicLLM, messages: list[dict[str, str]]) -> str:
    return "".join(llm.stream(messages, temperature=0.2, max_tokens=2200)).strip()


def _extract_json_block(raw: str) -> dict[str, Any]:
    candidate = raw.strip()
    if "```json" in candidate:
        candidate = candidate.split("```json", 1)[1]
        candidate = candidate.split("```", 1)[0]
    elif "```" in candidate:
        candidate = candidate.split("```", 1)[1]
        candidate = candidate.split("```", 1)[0]
    start = candidate.find("{")
    end = candidate.rfind("}")
    if start >= 0 and end >= start:
        candidate = candidate[start : end + 1]
    data = json.loads(candidate)
    if not isinstance(data, dict):
        raise ValueError("Réponse JSON invalide (objet attendu).")
    return data


@dataclass
class ExerciseRecord:
    exercise_id: str
    title: str
    context: str
    questions: list[dict[str, Any]]
    created_at: float


class PedagogyService:
    """Orchestre retrieval + génération pédagogique."""

    def __init__(self, retriever: LegalRetriever, llm: AnthropicLLM) -> None:
        self.retriever = retriever
        self.llm = llm
        self._exercise_store: dict[str, ExerciseRecord] = {}
        self._lock = Lock()

    def _search(
        self, query: str, domaine: str | None, include_uploads: bool
    ) -> list[LegalChunk]:
        return self.retriever.search(
            query,
            domaine=domaine,
            k=TOP_K,
            include_uploads=include_uploads,
        )

    def build_lesson(
        self,
        topic: str,
        domaine: str | None,
        level: str,
        include_uploads: bool = False,
    ) -> dict[str, Any]:
        chunks = self._search(topic, domaine, include_uploads)
        contexte = format_context(chunks)
        messages = [
            {"role": "system", "content": LESSON_PROMPT},
            {"role": "user", "content": build_lesson_message(topic, level, contexte)},
        ]
        lesson = _collect_stream(self.llm, messages)
        return {
            "topic": topic,
            "domaine": domaine,
            "level": level,
            "lesson": lesson,
            "sources": [_chunk_to_dict(c) for c in chunks],
            "source_stats": _source_summary(chunks),
            "metadata": {"source_first": bool(chunks), "module": "lesson"},
        }

    def build_exercise(
        self,
        topic: str,
        domaine: str | None,
        count: int,
        include_uploads: bool = False,
    ) -> dict[str, Any]:
        chunks = self._search(topic, domaine, include_uploads)
        contexte = format_context(chunks)
        prompt = EXERCISE_PROMPT.format(count=count)
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": build_exercise_message(topic, contexte)},
        ]
        raw = _collect_stream(self.llm, messages)
        data = _extract_json_block(raw)

        questions = data.get("questions", [])
        if not isinstance(questions, list) or not questions:
            raise ValueError("Le QCM généré ne contient aucune question exploitable.")

        normalized_questions: list[dict[str, Any]] = []
        for index, question in enumerate(questions, start=1):
            if not isinstance(question, dict):
                continue
            options = question.get("options", [])
            if not isinstance(options, list) or len(options) < 2:
                continue
            correct_option = question.get("correct_option", 0)
            if not isinstance(correct_option, int) or correct_option < 0:
                correct_option = 0
            if correct_option >= len(options):
                correct_option = 0
            normalized_questions.append(
                {
                    "id": str(question.get("id") or f"q{index}"),
                    "prompt": str(question.get("prompt") or "Question"),
                    "options": [str(opt) for opt in options[:4]],
                    "correct_option": correct_option,
                    "explanation": str(question.get("explanation") or ""),
                }
            )

        if not normalized_questions:
            raise ValueError("Le QCM généré est invalide après normalisation.")

        exercise_id = uuid.uuid4().hex
        record = ExerciseRecord(
            exercise_id=exercise_id,
            title=str(data.get("title") or f"QCM - {topic}"),
            context=str(data.get("context") or "Exercice base sur les sources disponibles."),
            questions=normalized_questions[:count],
            created_at=time.time(),
        )
        with self._lock:
            self._exercise_store[exercise_id] = record

        return {
            "topic": topic,
            "domaine": domaine,
            "format": "qcm",
            "exercise": {
                "exercise_id": record.exercise_id,
                "title": record.title,
                "context": record.context,
                "questions": record.questions,
            },
            "sources": [_chunk_to_dict(c) for c in chunks],
            "source_stats": _source_summary(chunks),
            "metadata": {"source_first": bool(chunks), "module": "exercise"},
        }

    def build_correction(
        self,
        exercise_id: str,
        topic: str,
        domaine: str | None,
        answers: list[dict[str, Any]],
        include_uploads: bool = False,
    ) -> dict[str, Any]:
        with self._lock:
            exercise = self._exercise_store.get(exercise_id)
        if exercise is None:
            raise ValueError("Exercice introuvable. Regénérez un QCM avant la correction.")

        by_question = {
            str(item.get("question_id")): item
            for item in answers
            if isinstance(item, dict) and item.get("question_id")
        }
        feedback: list[dict[str, Any]] = []
        score = 0
        for question in exercise.questions:
            qid = str(question["id"])
            selected_option = by_question.get(qid, {}).get("selected_option")
            is_correct = selected_option == question["correct_option"]
            if is_correct:
                score += 1
            feedback.append(
                {
                    "question_id": qid,
                    "selected_option": selected_option,
                    "expected_option": question["correct_option"],
                    "is_correct": is_correct,
                    "explanation": question["explanation"],
                }
            )

        chunks = self._search(topic, domaine, include_uploads)
        contexte = format_context(chunks)
        messages = [
            {"role": "system", "content": CORRECTION_PROMPT},
            {
                "role": "user",
                "content": build_correction_message(
                    topic=topic,
                    exercise_title=exercise.title,
                    correction_rows=feedback,
                    contexte=contexte,
                ),
            },
        ]
        raw = _collect_stream(self.llm, messages)
        try:
            data = _extract_json_block(raw)
        except Exception:
            data = {"revision_tips": []}
        tips = data.get("revision_tips")
        if not isinstance(tips, list):
            tips = []
        tips = [str(t) for t in tips if str(t).strip()][:5]
        if not tips:
            tips = [
                "Revoyez chaque explication question par question avant une nouvelle tentative.",
                "Concentrez-vous sur les articles cites pour distinguer regle, condition et exception.",
            ]

        return {
            "exercise_id": exercise_id,
            "score": score,
            "total": len(exercise.questions),
            "feedback": feedback,
            "revision_tips": tips,
            "sources": [_chunk_to_dict(c) for c in chunks],
            "source_stats": _source_summary(chunks),
            "metadata": {"source_first": bool(chunks), "module": "correction"},
        }
