"""Configuration centralisée du projet.

Charge les variables d'environnement depuis `.env` et expose les constantes
utilisées par les modules RAG et agent.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Racine du projet (first/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")

# --- Groq / LLM ---
GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY")
# Modèle principal Mistral sur Groq. La liste des modèles Groq évolue — en
# cas d'erreur 404/modèle indisponible au runtime, on bascule sur le fallback.
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "mistral-saba-24b")
GROQ_MODEL_FALLBACK: str = "llama-3.1-8b-instant"

# --- Embeddings ---
EMBEDDING_MODEL: str = "intfloat/multilingual-e5-base"

# --- Vector store (ChromaDB) ---
CHROMA_PATH: str = str(PROJECT_ROOT / "chroma_db")
COLLECTION_NAME: str = "droit_gabonais"

# --- Corpus ---
CORPUS_DIR: Path = PROJECT_ROOT / "data" / "legal_corpus"

# --- RAG ---
TOP_K: int = 5
CHUNK_MAX_CHARS: int = 1200  # taille max d'un chunk avant re-split

# Mapping nom de fichier (sans extension) -> (libellé domaine, source humaine)
DOMAINES: dict[str, dict[str, str]] = {
    "travail": {
        "label": "Droit du travail",
        "source": "Code du travail gabonais",
    },
    "foncier": {
        "label": "Droit foncier",
        "source": "Loi n° 14/63 et textes fonciers gabonais",
    },
    "famille": {
        "label": "Droit de la famille",
        "source": "Code civil gabonais",
    },
}
