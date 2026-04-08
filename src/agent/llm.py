"""Client Groq avec streaming."""

from __future__ import annotations

from typing import Iterator

from groq import Groq

from src.config import GROQ_API_KEY, GROQ_MODEL, GROQ_MODEL_FALLBACK


class GroqLLM:
    """Wrapper autour du client Groq avec fallback de modèle."""

    def __init__(self) -> None:
        if not GROQ_API_KEY:
            raise RuntimeError(
                "GROQ_API_KEY manquante. Créez un fichier .env à partir de .env.example."
            )
        self._client = Groq(api_key=GROQ_API_KEY)
        self._model = GROQ_MODEL
        self._fallback_used = False

    @property
    def current_model(self) -> str:
        return self._model

    def stream(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> Iterator[str]:
        """Stream la réponse du LLM token par token.

        En cas d'erreur avec le modèle principal (indisponibilité, 404), bascule
        automatiquement sur ``GROQ_MODEL_FALLBACK``.
        """
        try:
            yield from self._stream_with_model(
                self._model, messages, temperature, max_tokens
            )
        except Exception as exc:  # noqa: BLE001 — on veut attraper largement pour fallback
            if self._fallback_used or self._model == GROQ_MODEL_FALLBACK:
                raise
            print(
                f"[warn] Modèle '{self._model}' indisponible ({exc}). "
                f"Bascule sur '{GROQ_MODEL_FALLBACK}'."
            )
            self._model = GROQ_MODEL_FALLBACK
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
        completion = self._client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        for chunk in completion:
            delta = chunk.choices[0].delta
            content = getattr(delta, "content", None)
            if content:
                yield content
