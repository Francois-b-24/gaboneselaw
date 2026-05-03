"""Pipeline d'ingestion juridique (PDF hiérarchique, web, enrichissement)."""

from src.ingestion.pipeline import run_legal_ingest_pipeline

__all__ = ["run_legal_ingest_pipeline"]
