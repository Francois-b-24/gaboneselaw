This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Chat architecture

The chatbot appelle en **same-origin** `POST /api/chat` (Next.js). La route
relaye vers le backend FastAPI (`NEXT_PUBLIC_API_BASE_URL` + `/api/chat`), ce
qui évite les blocages **CORS** du navigateur. `POST /api/session/clear` est
relayé de la même façon.

## Frontend environment variables

Required:

- `NEXT_PUBLIC_API_BASE_URL` (example local: `http://localhost:8000`)

After changing environment variables on your hosting platform (Vercel or similar),
trigger a new deployment so runtime picks up the updated values.

## Backend requirements reminder

The backend service must provide:

- `POST /api/chat` with `answer`, `sources`, and `quality` fields.
- RAG + LLM configuration (Anthropic key/model, vector store, CORS) on the
  backend deployment platform (Render).

## Local startup checklist

Run backend first, then frontend.

1. Backend (from `/Users/f.b/dev/first`):

```bash
python3 -m pip install -r requirements.txt
python3 -m uvicorn webapp.main:app --host 127.0.0.1 --port 8000
```

2. Backend health checks:

```bash
curl "http://127.0.0.1:8000/api/suggested-questions"
curl -X POST "http://127.0.0.1:8000/api/chat" -H "Content-Type: application/json" -d '{"question":"Test"}'
```

3. Frontend (from `/Users/f.b/dev/first/webapp/frontend`):

```bash
npm run dev
```

If the chatbot loader spins forever or errors:
- ensure no stale process is blocking port 8000,
- restart backend after env changes,
- confirm `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `.env.local`.
