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

# --- Anthropic / LLM ---
ANTHROPIC_API_KEY: str | None = os.getenv("ANTHROPIC_API_KEY")
# Modèle principal recommandé pour le chat juridique en production.
ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
# Fallback économique en cas d'indisponibilité/erreur du modèle principal.
ANTHROPIC_MODEL_FALLBACK: str = os.getenv("ANTHROPIC_MODEL_FALLBACK", "claude-haiku-4-5")

# --- Embeddings ---
EMBEDDING_MODEL: str = "intfloat/multilingual-e5-base"

# --- Vector store (ChromaDB) ---
CHROMA_PATH: str = str(PROJECT_ROOT / "chroma_db")
COLLECTION_NAME: str = "droit_gabonais"
# Collection jetable pour les PDFs uploadés à la volée depuis l'UI — recréée à
# chaque upload, pas persistée entre sessions.
UPLOAD_COLLECTION_NAME: str = "droit_gabonais_uploads"

# --- Corpus ---
PDF_DIR: Path = PROJECT_ROOT / "data" / "pdfs"
PDF_MANIFEST_FILE: Path = PDF_DIR / "manifest.yaml"
WEB_SOURCES_FILE: Path = PROJECT_ROOT / "data" / "web_sources.yaml"
# Registre SQLite des articles (texte intégral, liens chunks BM25)
SOURCES_DB_PATH: Path = Path(
    os.getenv("SOURCES_DB_PATH", str(PROJECT_ROOT / "data" / "sources.db"))
)
# Logs structurés RAG (reformulations, ids de chunks, citations validées)
AUDIT_RAG_DB_PATH: Path = Path(
    os.getenv("AUDIT_RAG_DB_PATH", str(PROJECT_ROOT / "data" / "audit_rag.db"))
)
# Pipeline : hybrid dense+BM25+RRF, reranker, citations structurées
USE_HYBRID_RAG: bool = os.getenv("USE_HYBRID_RAG", "0").strip().lower() in ("1", "true", "yes")
RAG_RERANKER: bool = os.getenv("RAG_RERANKER", "0").strip().lower() in ("1", "true", "yes")
RAG_DUAL_COLLECTION: bool = os.getenv("RAG_DUAL_COLLECTION", "0").strip().lower() in ("1", "true", "yes")
RAG_STRUCTURED_CITATIONS: bool = os.getenv("RAG_STRUCTURED_CITATIONS", "0").strip().lower() in (
    "1",
    "true",
    "yes",
)
RERANKER_MODEL: str = os.getenv("RERANKER_MODEL", "BAAI/bge-reranker-v2-m3")
# Ingestion : 1 = pipeline juridique (pdfplumber + SQLite + option dual vectors), 0 = legacy pypdf
USE_LEGAL_PIPELINE: bool = os.getenv("USE_LEGAL_PIPELINE", "0").strip().lower() in ("1", "true", "yes")
# Nom de la collection Chroma pour les embeddings des « questions » enrichies
COLLECTION_NAME_QUESTIONS: str = os.getenv(
    "COLLECTION_NAME_QUESTIONS", f"{COLLECTION_NAME}_questions"
)

# --- RAG ---
TOP_K: int = 5
CHUNK_MAX_CHARS: int = 1200  # taille max d'un chunk avant re-split
MAX_AGENT_ITERATIONS: int = 5  # nombre max de tours outil dans la boucle agent

# --- Infra (production) ---
# URL Redis (ex: redis://localhost:6379/0 ou rediss://... pour service managé).
REDIS_URL: str | None = os.getenv("REDIS_URL")
# Origines CORS autorisées pour le backend web (CSV).
# Inclure localhost et 127.0.0.1 pour éviter les refus CORS en dev selon l’URL du navigateur.
FRONTEND_ORIGINS: str = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)

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
    "commercial": {
        "label": "Droit commercial",
        "source": "Actes uniformes OHADA et textes commerciaux gabonais",
    },
    "administratif": {
        "label": "Droit administratif",
        "source": "Textes administratifs gabonais",
    },
    "penal": {
        "label": "Droit pénal",
        "source": "Code pénal gabonais",
    },
    "fiscal": {
        "label": "Droit fiscal",
        "source": "Code général des impôts du Gabon",
    },
    "numerique": {
        "label": "Droit du numérique",
        "source": "Textes gabonais sur le numérique et les données",
    },
}
