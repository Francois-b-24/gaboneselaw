# Agent "Info Juridique Citoyenne" — Gabon

Agent de vulgarisation du droit gabonais (travail, foncier, famille) construit avec **Streamlit**, **Groq (Mistral)** et **ChromaDB** (RAG).

L'objectif est de rendre le droit gabonais plus accessible aux citoyens en répondant à leurs questions en langage simple, avec les références aux textes de loi.

> ⚠️ **Avertissement légal** : cet agent fournit des informations juridiques à titre éducatif uniquement. Il ne remplace **en aucun cas** la consultation d'un avocat ou d'un professionnel du droit.

---

## Architecture

- **LLM** : Mistral via [Groq](https://groq.com/) (streaming)
- **RAG** : ChromaDB + embeddings multilingues (`intfloat/multilingual-e5-base`)
- **UI** : Streamlit (chat, citations, historique, filtre par domaine, upload PDF à la volée, synthèse/rapport)
- **Corpus** : PDFs officiels (`data/pdfs/`) + pages web (`data/web_sources.yaml`)

```
first/
├── app.py                    # UI Streamlit
├── src/
│   ├── config.py
│   ├── rag/                  # Ingestion, loaders (PDF/Web), retriever Chroma
│   └── agent/                # Prompts, client Groq, tools, synthesizer
└── data/
    ├── pdfs/
    │   ├── manifest.yaml     # Mapping fichier → domaine + source
    │   └── *.pdf
    └── web_sources.yaml      # URLs à scraper
```

---

## Installation

```bash
python -m venv venv
source venv/bin/activate       # (Linux/Mac)
pip install -r requirements.txt
```

## Configuration

1. Créer un compte sur https://console.groq.com et récupérer une clé API.
2. Copier `.env.example` vers `.env` et renseigner `GROQ_API_KEY`.

```bash
cp .env.example .env
# éditer .env
```

## Ingestion du corpus

```bash
python -m src.rag.ingest
```

Cette commande :
1. Parcourt `data/pdfs/*.pdf` et indexe ceux qui ont une entrée dans `manifest.yaml`.
2. Scrape les URLs listées dans `data/web_sources.yaml`.
3. Crée les embeddings et les persiste dans `chroma_db/`.

La collection est **recréée à chaque run** (idempotent et destructif).

## Lancement de l'application

```bash
streamlit run app.py
```

Ouvrir http://localhost:8501 dans votre navigateur.

---

## Enrichir le corpus

### Ajouter un PDF permanent

1. Déposer le fichier dans `data/pdfs/`.
2. Ajouter une entrée dans `data/pdfs/manifest.yaml` :

   ```yaml
   - file: mon-document.pdf
     domaine: travail          # travail | foncier | famille
     source: "Libellé humain affiché dans les sources citées"
   ```

3. Relancer `python -m src.rag.ingest`.

Un PDF sans entrée de manifest est ignoré à l'ingestion.

### Ajouter une URL

1. Éditer `data/web_sources.yaml` et ajouter :

   ```yaml
   - url: https://example.ga/page-juridique
     domaine: travail
     source: "Nom lisible de la page"
   ```

2. Vérifier que le site autorise le scraping (robots.txt, CGU).
3. Relancer `python -m src.rag.ingest`.

Le loader web extrait uniquement du **HTML** — pour une URL qui pointe vers un PDF, télécharger le fichier localement et le placer dans `data/pdfs/`.

### Analyser un PDF ponctuel depuis l'UI

Dans la sidebar Streamlit, utiliser le bouton **« Analyser un document »** pour uploader un PDF. Il est indexé dans une collection séparée, fusionné avec les résultats de recherche pendant la session, et libéré au prochain chargement.

---

## Scénarios d'exemple

- *Droit du travail* : « Mon patron m'a licencié sans préavis, ai-je droit à une indemnité ? »
- *Droit foncier* : « Mon village possède une terre coutumière, comment obtenir un titre foncier ? »
- *Droit de la famille* : « Après un divorce, qui obtient la garde des enfants ? »
