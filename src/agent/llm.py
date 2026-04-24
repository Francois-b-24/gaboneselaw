"""Client Anthropic avec streaming compatible agent."""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Iterator

from anthropic import Anthropic

from src.config import (
    ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL,
    ANTHROPIC_MODEL_FALLBACK,
)


class AnthropicLLM:
    """Wrapper Anthropic avec fallback et interface compatible."""

    def __init__(self) -> None:
        if not ANTHROPIC_API_KEY:
            raise RuntimeError(
                "ANTHROPIC_API_KEY manquante. Créez un fichier .env à partir de .env.example."
            )
        self._client = Anthropic(api_key=ANTHROPIC_API_KEY)
        self._model = ANTHROPIC_MODEL
        self._fallback_used = False

    @property
    def current_model(self) -> str:
        return self._model

    def stream_with_tools(
        self,
        messages: list[dict],
        tools: list[dict],
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> Iterator:
        """Stream la réponse avec tool use (format compatible agent actuel)."""
        try:
            yield from self._stream_raw(
                self._model, messages, tools, temperature, max_tokens
            )
        except Exception as exc:  # noqa: BLE001
            if self._fallback_used or self._model == ANTHROPIC_MODEL_FALLBACK:
                raise
            print(
                f"[warn] Modèle '{self._model}' indisponible ({exc}). "
                f"Bascule sur '{ANTHROPIC_MODEL_FALLBACK}'."
            )
            self._model = ANTHROPIC_MODEL_FALLBACK
            self._fallback_used = True
            yield from self._stream_raw(
                self._model, messages, tools, temperature, max_tokens
            )

    def _stream_raw(
        self,
        model: str,
        messages: list[dict],
        tools: list[dict],
        temperature: float,
        max_tokens: int,
    ) -> Iterator[SimpleNamespace]:
        """Appel Anthropic streaming puis adaptation vers le format agent."""
        system, anthropic_messages = _convert_messages_for_anthropic(messages)
        anthropic_tools = _convert_tools_for_anthropic(tools)
        response = self._client.messages.create(
            model=model,
            system=system,
            messages=anthropic_messages,
            tools=anthropic_tools if anthropic_tools else None,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        tool_calls_meta: dict[int, dict[str, str]] = {}

        for event in response:
            event_type = getattr(event, "type", "")
            if event_type == "content_block_start":
                content_block = getattr(event, "content_block", None)
                if getattr(content_block, "type", "") != "tool_use":
                    continue
                index = int(getattr(event, "index", 0))
                tool_calls_meta[index] = {
                    "id": getattr(content_block, "id", ""),
                    "name": getattr(content_block, "name", ""),
                }
                continue

            if event_type == "content_block_delta":
                delta = getattr(event, "delta", None)
                delta_type = getattr(delta, "type", "")
                if delta_type == "text_delta":
                    text = getattr(delta, "text", "")
                    if text:
                        yield _make_text_event(text)
                    continue
                if delta_type == "input_json_delta":
                    index = int(getattr(event, "index", 0))
                    partial_json = getattr(delta, "partial_json", "")
                    if not partial_json:
                        continue
                    meta = tool_calls_meta.get(index, {"id": "", "name": ""})
                    yield _make_tool_call_event(
                        call_id=meta["id"],
                        name=meta["name"],
                        arguments=partial_json,
                        index=index,
                    )

    def stream(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> Iterator[str]:
        """Stream la réponse du LLM token par token.

        En cas d'erreur avec le modèle principal (indisponibilité, 404),
        bascule automatiquement sur ``ANTHROPIC_MODEL_FALLBACK``.
        """
        try:
            yield from self._stream_with_model(
                self._model, messages, temperature, max_tokens
            )
        except Exception as exc:  # noqa: BLE001
            if self._fallback_used or self._model == ANTHROPIC_MODEL_FALLBACK:
                raise
            print(
                f"[warn] Modèle '{self._model}' indisponible ({exc}). "
                f"Bascule sur '{ANTHROPIC_MODEL_FALLBACK}'."
            )
            self._model = ANTHROPIC_MODEL_FALLBACK
            self._fallback_used = True
            yield from self._stream_with_model(
                self._model, messages, temperature, max_tokens
            )

    def _stream_with_model(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> Iterator[str]:
        system, anthropic_messages = _convert_messages_for_anthropic(messages)
        response = self._client.messages.create(
            model=model,
            system=system,
            messages=anthropic_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        for event in response:
            if getattr(event, "type", "") != "content_block_delta":
                continue
            delta = getattr(event, "delta", None)
            if getattr(delta, "type", "") != "text_delta":
                continue
            text = getattr(delta, "text", "")
            if text:
                yield text


def _convert_tools_for_anthropic(tools: list[dict]) -> list[dict]:
    adapted: list[dict] = []
    for tool in tools:
        function = tool.get("function") if isinstance(tool, dict) else None
        if not isinstance(function, dict):
            continue
        adapted.append(
            {
                "name": function.get("name"),
                "description": function.get("description", ""),
                "input_schema": function.get("parameters", {"type": "object", "properties": {}}),
            }
        )
    return adapted


def _convert_messages_for_anthropic(messages: list[dict]) -> tuple[str, list[dict]]:
    system_text = ""
    out: list[dict] = []

    for message in messages:
        role = message.get("role")
        if role == "system":
            system_text = message.get("content", "")
            continue
        if role == "assistant" and message.get("tool_calls"):
            blocks = []
            for tc in message["tool_calls"]:
                function = tc.get("function", {})
                args = function.get("arguments", "{}")
                try:
                    parsed = json.loads(args)
                except json.JSONDecodeError:
                    parsed = {}
                blocks.append(
                    {
                        "type": "tool_use",
                        "id": tc.get("id"),
                        "name": function.get("name"),
                        "input": parsed,
                    }
                )
            out.append({"role": "assistant", "content": blocks})
            continue
        if role == "tool":
            out.append(
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": message.get("tool_call_id"),
                            "content": message.get("content", ""),
                        }
                    ],
                }
            )
            continue
        if role in ("user", "assistant"):
            out.append({"role": role, "content": message.get("content", "")})

    return system_text, out


def _make_text_event(content: str) -> SimpleNamespace:
    return SimpleNamespace(
        choices=[
            SimpleNamespace(
                delta=SimpleNamespace(content=content, tool_calls=None),
            )
        ]
    )


def _make_tool_call_event(
    call_id: str,
    name: str,
    arguments: str,
    index: int,
) -> SimpleNamespace:
    tool_call = SimpleNamespace(
        index=index,
        id=call_id,
        function=SimpleNamespace(name=name, arguments=arguments),
    )
    return SimpleNamespace(
        choices=[
            SimpleNamespace(
                delta=SimpleNamespace(content=None, tool_calls=[tool_call]),
            )
        ]
    )
