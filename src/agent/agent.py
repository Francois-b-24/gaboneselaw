"""Orchestration de l'agent : retrieve → prompt → LLM streaming."""

from __future__ import annotations

from typing import Iterator

from src.agent.llm import GroqLLM
from src.agent.prompts import SYSTEM_PROMPT, build_user_message
from src.config import TOP_K
from src.rag.retriever import LegalChunk, LegalRetriever


class LegalAgent:
    """Agent RAG juridique gabonais."""

    def __init__(self) -> None:
        self.retriever = LegalRetriever()
        self.llm = GroqLLM()

    def answer(
        self,
        question: str,
        domaine: str | None = None,
        history: list[dict[str, str]] | None = None,
        k: int = TOP_K,
    ) -> tuple[Iterator[str], list[LegalChunk]]:
        """Répond à une question juridique.

        :param question: question posée par l'utilisateur
        :param domaine: filtre de domaine (``travail``/``foncier``/``famille``) ou None
        :param history: historique conversationnel au format OpenAI
                        (``[{"role": "user"|"assistant", "content": ...}, ...]``)
        :param k: nombre de chunks à récupérer
        :return: ``(generator de tokens, liste des chunks utilisés)``
        """
        chunks = self.retriever.search(question, domaine=domaine, k=k)

        messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            # On conserve uniquement les rôles user/assistant de l'historique
            for m in history:
                if m.get("role") in ("user", "assistant") and m.get("content"):
                    messages.append({"role": m["role"], "content": m["content"]})

        messages.append({"role": "user", "content": build_user_message(question, chunks)})

        return self.llm.stream(messages), chunks
