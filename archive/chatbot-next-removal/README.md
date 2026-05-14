# Archive — retrait chatbot Next (Ama'IA)

**Date** : 2026-05-14

Les fichiers ci-dessous sont des copies des éléments retirés du site Next (`webapp/frontend/`) : route `/chatbot`, composant, relais API vers FastAPI.

## Fichiers archivés (chemins relatifs à la racine du dépôt)

| Original (avant suppression) |
|------------------------------|
| `webapp/frontend/src/app/chatbot/page.tsx` |
| `webapp/frontend/src/components/chatbot.tsx` |
| `webapp/frontend/src/app/api/chat/route.ts` |
| `webapp/frontend/src/app/api/session/clear/route.ts` |
| `landing-chatbot-section.tsx` (extrait retiré de `landing-page.tsx`) |

## Restauration rapide

1. Recopier les fichiers depuis `archive/chatbot-next-removal/webapp/frontend/...` vers les mêmes chemins sous `webapp/frontend/src/`.
2. Réinsérer le bloc dans `src/components/ui/landing-page.tsx` (voir `landing-chatbot-section.tsx`).
3. Rétablir les liens dans `site-header.tsx`, `site-footer.tsx`, `ressources/page.tsx`, `blog-articles.ts` si besoin.
4. Variable d’environnement côté Next (pour les routes API de relais) : **`NEXT_PUBLIC_API_BASE_URL`** — URL du backend FastAPI (ex. `http://127.0.0.1:8000`).

## Backend (inchangé dans ce retrait)

Le FastAPI expose toujours notamment `POST /api/chat` et `POST /api/session/clear` — voir `webapp/main.py`.
