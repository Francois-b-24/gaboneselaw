#!/usr/bin/env python3
"""Réindexation contrôlée du corpus (pipeline légal + Chroma + SQLite).

Usage :
  USE_LEGAL_PIPELINE=1 python scripts/reindex.py
  python scripts/reindex.py --no-enrich   # saute Claude Haiku (plus rapide)

Ne supprime pas les PDF sources ; recrée ``chroma_db`` collection(s) et
réinitialise ``data/sources.db`` (sauf ``--append-db`` futur — non implémenté).
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("USE_LEGAL_PIPELINE", "1")

from src.config import CHROMA_PATH  # noqa: E402
from src.ingestion.pipeline import run_legal_ingest_pipeline  # noqa: E402
from src.storage.source_registry import SourceRegistry  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Réindexation RAG juridique")
    parser.add_argument("--no-enrich", action="store_true", help="Désactive enrichissement Haiku")
    args = parser.parse_args()

    registry = SourceRegistry()
    total = run_legal_ingest_pipeline(
        registry=registry,
        chroma_path=CHROMA_PATH,
        clear_registry=True,
        enrich=not args.no_enrich,
    )
    if total == 0:
        print("Échec : aucun chunk produit.", file=sys.stderr)
        return 1
    print(f"OK — {total} chunks indexés.")
    print(f"SQLite : {registry.db_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
