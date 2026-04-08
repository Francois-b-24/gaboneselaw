"""Fonction d'embedding compatible avec l'API ChromaDB.

Utilise `sentence-transformers` avec un modèle multilingue optimisé pour
le français (intfloat/multilingual-e5-base).
"""

from __future__ import annotations

from functools import lru_cache

from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
from sentence_transformers import SentenceTransformer

from src.config import EMBEDDING_MODEL


@lru_cache(maxsize=1)
def _load_model() -> SentenceTransformer:
    """Charge le modèle une seule fois (coûteux)."""
    return SentenceTransformer(EMBEDDING_MODEL)


class E5EmbeddingFunction(EmbeddingFunction):
    """Embedding function au format Chroma.

    Le modèle e5 attend les préfixes ``passage:`` (indexation) et
    ``query:`` (recherche). Par défaut on préfixe ``passage:`` — la classe
    ``LegalRetriever`` gère explicitement le préfixe ``query:`` au moment de
    la recherche.
    """

    def __init__(self, prefix: str = "passage: ") -> None:
        self.prefix = prefix

    def __call__(self, input: Documents) -> Embeddings:  # noqa: A002 (API Chroma)
        model = _load_model()
        texts = [f"{self.prefix}{t}" for t in input]
        vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
        return vectors.tolist()


def embed_query(text: str) -> list[float]:
    """Embed une requête utilisateur avec le préfixe ``query:``."""
    model = _load_model()
    vector = model.encode(
        [f"query: {text}"], normalize_embeddings=True, show_progress_bar=False
    )
    return vector[0].tolist()
