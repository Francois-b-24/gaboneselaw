# Agent "Info Juridique Citoyenne" — Gabon

Agent de vulgarisation du droit gabonais (travail, foncier, famille) construit avec **Streamlit**, **Groq (Mistral)** et **ChromaDB** (RAG).

L'objectif est de rendre le droit gabonais plus accessible aux citoyens en répondant à leurs questions en langage simple, avec les références aux textes de loi.

> ⚠️ **Avertissement légal** : cet agent fournit des informations juridiques à titre éducatif uniquement. Il ne remplace **en aucun cas** la consultation d'un avocat ou d'un professionnel du droit.

---

## Architecture

- **LLM** : Mistral via [Groq](https://groq.com/) (streaming)
- **RAG** : ChromaDB + embeddings multilingues (`intfloat/multilingual-e5-base`)
- **UI** : Streamlit (chat, citations, historique, filtre par domaine)
- **Corpus** : jeu de démonstration dans `data/legal_corpus/` (à enrichir)

```
first/
├── app.py                    # UI Streamlit
├── src/
│   ├── config.py
│   ├── rag/                  # Ingestion & retriever Chroma
│   └── agent/                # Prompts, client Groq, orchestration
└── data/legal_corpus/        # Corpus juridique (markdown)
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

Cette commande charge les fichiers `data/legal_corpus/*.md`, crée les embeddings et les persiste dans `chroma_db/`.

## Lancement de l'application

```bash
streamlit run app.py
```

Ouvrir http://localhost:8501 dans votre navigateur.

---

## Enrichir le corpus

Le corpus fourni est **un jeu de démonstration minimal** destiné à valider le pipeline. Pour un usage réel, il faut l'enrichir avec les textes officiels complets (Code du travail, Code civil, lois foncières, etc.).

1. Ajouter de nouveaux fichiers `.md` dans `data/legal_corpus/` en respectant le format :

   ```markdown
   # Titre du code

   ## Article X — Intitulé
   Texte de l'article...

   ## Article Y — Intitulé
   Texte de l'article...
   ```

2. Ajouter le nom de fichier (sans extension) à `DOMAINE_BY_FILE` dans `src/rag/ingest.py` si nécessaire.
3. Relancer `python -m src.rag.ingest`.

---

## Scénarios d'exemple

- *Droit du travail* : « Mon patron m'a licencié sans préavis, ai-je droit à une indemnité ? »
- *Droit foncier* : « Mon village possède une terre coutumière, comment obtenir un titre foncier ? »
- *Droit de la famille* : « Après un divorce, qui obtient la garde des enfants ? »
