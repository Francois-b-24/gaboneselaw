"""Wrapper de réponse agent — iterable pour st.write_stream + collecte des sources."""

from __future__ import annotations

from typing import Callable, Iterator

from src.rag.retriever import LegalChunk


class AgentResponse:
    """Réponse streamée de l'agent juridique.

    Utilisable directement avec ``st.write_stream(response)`` car iterable.
    Les sources (``LegalChunk``) sont collectées pendant le streaming et
    disponibles via ``response.sources`` une fois l'itération terminée.
    """

    def __init__(
        self,
        generator_factory: Callable[[list[LegalChunk]], Iterator[str]],
    ) -> None:
        self._factory = generator_factory
        self.sources: list[LegalChunk] = []

    def __iter__(self) -> Iterator[str]:
        yield from self._factory(self.sources)
