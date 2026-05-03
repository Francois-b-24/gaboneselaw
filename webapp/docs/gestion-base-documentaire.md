# Guide d'alimentation de la base documentaire

Ce guide explique comment ajouter des contenus juridiques dans la base RAG
utilisee par l'agent Python (`main.py` + `src/agent/...`).

## 1) Ajouter des PDF juridiques

1. Deposer le fichier PDF dans:
   - `data/pdfs/`
2. Ouvrir le manifest:
   - `data/pdfs/manifest.yaml`
3. Ajouter une entree pour le PDF avec:
   - `domaine` (ex: `travail`, `foncier`, `famille`, etc.)
   - `source` (nom humain lisible de la source)

Important:
- Si un PDF n'a pas d'entree dans `manifest.yaml`, il est ignore a l'ingestion.
- Si le `domaine` est inconnu, le PDF est ignore avec un log explicite.

## 2) Ajouter des sources web

1. Ouvrir:
   - `data/web_sources.yaml`
2. Ajouter une entree avec:
   - `url`
   - `domaine`
   - `source`

Important:
- Les pages web doivent etre HTML (pas des liens PDF directs).
- Une URL en erreur n'arrete pas toute l'ingestion: elle est skippee avec warning.

## 3) Relancer l'ingestion

Depuis la racine du projet:

```bash
python -m src.rag.ingest
```

Ce script recree la collection principale: l'operation est idempotente mais
destructive (la collection est supprimee puis reconstruite).

## 4) Verifier que les nouveaux contenus sont bien pris en compte

Verification rapide en Python:

```python
from src.rag.retriever import LegalRetriever
results = LegalRetriever().search("licenciement abusif", domaine="travail", k=3)
print(len(results))
for r in results:
    print(r.citation)
```

Verification applicative:
- Appeler `POST /api/diagnostics/llm`
- Verifier que `ok` est `true` et que les checks retrieval/sources passent.

## 5) Erreurs frequentes

- **`ANTHROPIC_API_KEY` manquante**:
  le backend ne peut pas produire de reponse LLM.
- **Frontend en erreur "Une erreur est survenue pendant la reponse de l'assistant"**:
  verifier que le backend est demarre avec:
  `python3 -m uvicorn webapp.main:app --host 127.0.0.1 --port 8000`
  depuis la racine `/Users/f.b/dev/first`.
- **Collection vide**:
  ingestion non lancee, ou corpus ignore (manifest/domaines incorrects).
- **Pas de resultats pertinents**:
  requete trop vague ou domaine mal choisi.
- **CORS en prod**:
  verifier `FRONTEND_ORIGINS` cote backend (Render).
