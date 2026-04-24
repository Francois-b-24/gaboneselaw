# Info Juridique Citoyenne - Gabon

Assistant juridique de vulgarisation sur le droit gabonais (travail, foncier, famille), base RAG ChromaDB, generation avec Claude via Anthropic.

> ⚠️ Cet outil fournit une information juridique generale et ne remplace pas un conseil juridique personnalise.

## Stack actuelle

- Backend: FastAPI (`webapp/main.py`) + pipeline RAG Python (`src/`)
- Frontend principal: Next.js App Router (`webapp/frontend/`)
- UI legacy: Streamlit (`app.py`) et pages HTML FastAPI (`webapp/templates/`)
- LLM: Anthropic (`claude-sonnet-4-6` + fallback `claude-haiku-4-5`)
- Vector DB: ChromaDB
- Session/rate limiting prod: Redis (optionnel en local, recommande en production)

## Structure utile

```text
first/
├── app.py                      # UI Streamlit (legacy)
├── src/                        # Agent + RAG (shared)
├── data/                       # Corpus PDF + web sources
├── webapp/
│   ├── main.py                 # Backend FastAPI (API + SSE + CORS)
│   ├── templates/              # UI HTML legacy
│   ├── static/
│   └── frontend/               # Next.js App Router (nouveau frontend)
└── requirements.txt
```

## Installation locale

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Variables minimales dans `.env`:

- `ANTHROPIC_API_KEY`
- `FRONTEND_ORIGINS` (ex: `http://localhost:3000`)

Variables recommandees en prod:

- `REDIS_URL` (sessions + rate limiting distribues)
- `ANTHROPIC_MODEL` (defaut: `claude-sonnet-4-6`)
- `ANTHROPIC_MODEL_FALLBACK` (defaut: `claude-haiku-4-5`)

## Ingestion du corpus RAG

```bash
python -m src.rag.ingest
```

Cette commande recree la collection Chroma (`droit_gabonais`) puis:

- indexe les PDFs declares dans `data/pdfs/manifest.yaml`
- scrape les URLs declarees dans `data/web_sources.yaml`

## Lancer le backend FastAPI

```bash
uvicorn webapp.main:app --reload --port 8000
```

API principale:

- `POST /api/chat` (non-streaming)
- `POST /api/chat/stream` (SSE)
- `POST /api/upload-pdf`
- `POST /api/synthesis`
- `POST /api/report`

## Lancer le frontend Next.js

```bash
cd webapp/frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Deploiement recommande

### Frontend (Vercel)

- Projet racine: `webapp/frontend`
- Variable env:
  - `NEXT_PUBLIC_API_BASE_URL=https://<votre-backend>`

### Backend (Render / Railway / Fly.io)

- Commande start: `uvicorn webapp.main:app --host 0.0.0.0 --port $PORT`
- Variables env:
  - `ANTHROPIC_API_KEY=...`
  - `FRONTEND_ORIGINS=https://<votre-frontend-vercel>`
  - `REDIS_URL=rediss://...` (Upstash/Redis Cloud conseille)

### Redis (managé)

- Utilise un plan managé (Upstash, Redis Cloud, etc.)
- Le backend bascule en mode memoire si Redis est absent, mais ce mode n'est pas adapte au multi-instance.

## Enrichir les sources

### Ajouter un PDF permanent

1. Deposer le fichier dans `data/pdfs/`
2. Ajouter son entree dans `data/pdfs/manifest.yaml`
3. Relancer `python -m src.rag.ingest`

### Ajouter une source web

1. Ajouter une entree dans `data/web_sources.yaml`
2. Verifier robots.txt/CGU
3. Relancer `python -m src.rag.ingest`
