"""Évaluation Ragas (hors chemin critique) — dataset de référence minimal.

Exécution manuelle :
  pip install ragas datasets
  python -m src.evaluation.ragas_eval
"""

from __future__ import annotations

import json
from pathlib import Path

# 30 questions types (placeholder court — à enrichir avec ground_truth)
EVAL_QUESTIONS: list[dict[str, str]] = [
    {"question": "Quel est le taux de l'IS au Gabon ?", "ground_truth": ""},
    {"question": "Comment déclarer la TVA ?", "ground_truth": ""},
    {"question": "Qu'est-ce que la CFE ?", "ground_truth": ""},
    {"question": "Exonération IR : conditions générales", "ground_truth": ""},
    {"question": "Procédure de recouvrement", "ground_truth": ""},
]


def export_dataset_jsonl(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in EVAL_QUESTIONS:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def run_ragas_stub() -> dict[str, str]:
    """Placeholder : branchement Ragas réel une fois ``ground_truth`` rempli."""
    return {
        "status": "stub",
        "message": "Remplir ground_truth puis utiliser ragas.evaluate() avec votre LLM/embeddings.",
    }


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent.parent / "data" / "rag_eval_questions.jsonl"
    export_dataset_jsonl(out)
    print(run_ragas_stub())
    print("Dataset écrit :", out)
