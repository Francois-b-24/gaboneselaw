"""Orchestration de l'agent juridique avec tool use."""

from __future__ import annotations

import json
from typing import Iterator

from src.agent.llm import GroqLLM
from src.agent.prompts import SYSTEM_PROMPT, build_user_message
from src.agent.response import AgentResponse
from src.agent.tool_executor import execute_tool
from src.agent.tools import ALL_TOOLS
from src.config import MAX_AGENT_ITERATIONS
from src.rag.retriever import LegalChunk, LegalRetriever


class LegalAgent:
    """Agent RAG juridique gabonais avec tool use."""

    def __init__(self) -> None:
        self.retriever = LegalRetriever()
        self.llm = GroqLLM()

    def answer(
        self,
        question: str,
        domaine: str | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> AgentResponse:
        """Répond à une question juridique via la boucle agent.

        Le LLM décide quels outils appeler. Les tokens de la réponse finale
        sont streamés. Les sources sont collectées dans ``response.sources``.
        """
        messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            for m in history:
                if m.get("role") in ("user", "assistant") and m.get("content"):
                    messages.append({"role": m["role"], "content": m["content"]})

        messages.append({"role": "user", "content": build_user_message(question, domaine)})

        def _generate(sources_collector: list[LegalChunk]) -> Iterator[str]:
            yield from self._agent_loop(messages, domaine, sources_collector)

        return AgentResponse(_generate)

    def _agent_loop(
        self,
        messages: list[dict],
        domaine_hint: str | None,
        sources_collector: list[LegalChunk],
    ) -> Iterator[str]:
        """Boucle agent : stream → detect tool_calls → execute → loop."""
        for _ in range(MAX_AGENT_ITERATIONS):
            tool_calls_buf: dict[int, dict] = {}
            text_chunks: list[str] = []
            has_tool_calls = False

            stream = self.llm.stream_with_tools(messages, tools=ALL_TOOLS)

            for event in stream:
                choice = event.choices[0]
                delta = choice.delta

                # Accumulation des tool calls
                if delta.tool_calls:
                    has_tool_calls = True
                    for tc in delta.tool_calls:
                        idx = tc.index
                        if idx not in tool_calls_buf:
                            tool_calls_buf[idx] = {
                                "id": tc.id,
                                "name": getattr(tc.function, "name", None),
                                "arguments": "",
                            }
                        else:
                            # id et name peuvent arriver dans des chunks ultérieurs
                            if tc.id:
                                tool_calls_buf[idx]["id"] = tc.id
                            if getattr(tc.function, "name", None):
                                tool_calls_buf[idx]["name"] = tc.function.name
                        if getattr(tc.function, "arguments", None):
                            tool_calls_buf[idx]["arguments"] += tc.function.arguments

                # Streaming du contenu texte vers l'utilisateur
                content = getattr(delta, "content", None)
                if content:
                    text_chunks.append(content)
                    yield content

            # Si le LLM a produit du texte (réponse finale), on arrête la boucle
            if not has_tool_calls:
                break

            # Construire le message assistant avec les tool_calls
            assistant_tool_calls = []
            for _, tc_data in sorted(tool_calls_buf.items()):
                assistant_tool_calls.append({
                    "id": tc_data["id"],
                    "type": "function",
                    "function": {
                        "name": tc_data["name"],
                        "arguments": tc_data["arguments"],
                    },
                })

            messages.append({
                "role": "assistant",
                "tool_calls": assistant_tool_calls,
            })

            # Exécuter chaque outil et ajouter les résultats
            for tc_data in sorted(tool_calls_buf.values(), key=lambda x: x.get("id", "")):
                try:
                    args = json.loads(tc_data["arguments"])
                except json.JSONDecodeError:
                    args = {}

                result_text, chunks = execute_tool(
                    tc_data["name"],
                    args,
                    self.retriever,
                    domaine_hint=domaine_hint,
                )
                sources_collector.extend(chunks)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc_data["id"],
                    "content": result_text,
                })
        else:
            # Limite d'itérations atteinte — forcer une réponse texte
            messages.append({
                "role": "user",
                "content": "Réponds maintenant avec les informations que tu as collectées.",
            })
            stream = self.llm.stream_with_tools(messages, tools=[])
            for event in stream:
                content = getattr(event.choices[0].delta, "content", None)
                if content:
                    yield content
