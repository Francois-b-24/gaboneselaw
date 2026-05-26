# ALIN — alin-africa.com

Site éditorial d'**ALIN (African Legal Innovation Network)**, réseau panafricain
d'innovation juridique et maison-mère de l'initiative [LexGabon](https://www.lexgabon.com).

Le site partage la grammaire visuelle de LexGabon (typographie serif éditoriale,
palette ivoire/encre, italiques d'accent) tout en conservant une identité ALIN
distincte : **accent terre cuite `#9C4A2E`** et glyphe **❖** (là où LexGabon
utilise un vert sombre et le glyphe ◇).

## Stack

| | |
|---|---|
| Framework | **Next.js 16** (App Router, React 19) |
| Styles | **Tailwind CSS v4** — config CSS-first via `@theme` dans `src/app/globals.css` (pas de `tailwind.config`) |
| i18n | **next-intl 4** — FR (défaut, sans préfixe) + EN (`/en/…`) |
| Polices | `next/font` — Fraunces (serif), Geist / Geist Mono |
| Contenu | données typées dans `src/data/`, UI dans `messages/{fr,en}.json` |

> ⚠️ Next.js 16 introduit des changements de conventions par rapport aux versions
> antérieures (voir `AGENTS.md`). Notamment : le middleware s'appelle désormais
> `proxy` et, ce projet utilisant `src/`, il **doit** vivre dans `src/proxy.ts`.

## Démarrer

Prérequis : Node 20+ (développé sous Node 24).

```bash
npm install
npm run dev      # http://localhost:3000
```

Autres scripts :

```bash
npm run build    # build de production
npm run start    # sert le build de production
npm run lint     # ESLint
```

## Variables d'environnement

Copier `.env.local.example` vers `.env.local`. Toutes optionnelles (des valeurs
par défaut sont utilisées si absentes) :

| Variable | Rôle | Défaut |
|---|---|---|
| `NEXT_PUBLIC_CONTACT_EMAIL` | Destinataire du formulaire de contact (lien `mailto:`) | `felicia.oi@alin-africa.com` |
| `NEXT_PUBLIC_API_BASE_URL` | Backend FastAPI du monorepo, si servi (optionnel) | `http://localhost:8000` |

## Structure

```
src/
├─ app/
│  ├─ [locale]/          # toutes les pages, segmentées par locale
│  │  ├─ layout.tsx      # <html lang>, polices, provider next-intl, Schema.org
│  │  ├─ page.tsx        # accueil
│  │  ├─ manifeste/ blog/ a-propos/ contacts/ ressources/ …
│  ├─ layout.tsx         # racine (passe-plat)
│  ├─ globals.css        # tokens @theme + utilitaires (.eyebrow, .accent-italic, .prose-editorial)
│  ├─ sitemap.ts robots.ts
├─ components/
│  ├─ ui/                # Eyebrow, SectionTitle, FeatureCard, StatBlock
│  ├─ site-header.tsx site-footer.tsx locale-switcher.tsx …
├─ data/                 # blog-articles.ts, manifesto.ts (contenu long-form bilingue)
├─ i18n/                 # routing.ts, navigation.ts, request.ts
├─ proxy.ts              # middleware next-intl (négociation de locale)
messages/                # fr.json, en.json (chaînes UI)
```

## Internationalisation

- Locales dans `src/i18n/routing.ts` (`localePrefix: "as-needed"`).
- **Chaînes UI** → `messages/fr.json` + `messages/en.json` (les deux doivent
  avoir des clés identiques).
- **Contenu long-form** (manifeste, articles) → `src/data/`, dictionnaires par
  locale avec repli sur le français.
- Navigation interne : utiliser `Link` / `useRouter` / `redirect` depuis
  `@/i18n/navigation` (jamais `next/link` directement) pour préserver la locale.

## Identité de design

Tokens et utilitaires dans `src/app/globals.css`. Pour une nouvelle section, suivre
le motif **Eyebrow → SectionTitle (avec `accent` en italique terra) → texte muted**.
Ne pas introduire le glyphe ◇ ni d'accent autre que `terra` côté ALIN. Les liens
externes (`↗`) doivent porter un `aria-label` et `rel="noopener noreferrer"`.

## Monorepo

Ce site vit sous `webapp/frontend/` d'un dépôt qui contient aussi un pipeline RAG
Python (`src/`, `webapp/main.py`). Le site peut être lancé seul ; il ne dépend du
backend FastAPI que si l'on branche `NEXT_PUBLIC_API_BASE_URL`. L'ancienne
intégration chatbot Next est archivée sous `archive/`.
