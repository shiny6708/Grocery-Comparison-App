# FreshCompare — Grocery Price Comparison App

Modern responsive Next.js + Tailwind + Supabase + AI app.

## Milestones
1. ✅ Requirements & architecture — dashboard, price table, realtime, export, AI
2. ✅ Next.js & Tailwind UI — `src/app/page.tsx`, Recharts, Lucide
3. ✅ Supabase persistence — `src/lib/supabase/*`, `src/app/api/products`, `supabase/schema.sql`
4. ✅ AI model — `src/lib/ai.ts` local-smart-v1 + `/api/ai-suggest` (hybrid with optional LLM)
5. ⏳ Deploy to Vercel — see below

## Run locally
```bash
cd grocery-compare
npm install
cp .env.example .env.local  # optional
npm run dev  # http://localhost:3000
```

## Supabase setup
1. Create project at supabase.com
2. Run `supabase/schema.sql` in SQL editor
3. Set env vars in `.env.local` + Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. App auto-falls back to seed data if unset; uses Supabase when present. Realtime enabled for `products`.

## AI
- Works offline via rule-based optimizer (meal mapping, cheapest-basket, split-shop math).
- Optional: set `AI_API_URL` + `AI_API_KEY` (+ `AI_MODEL`) for OpenAI-compatible enrichment.

## Deploy to Vercel
```bash
npm i -g vercel
vercel --prod
# or: push to GitHub → vercel.com → Import → add env vars → Deploy
```

## Routes
- `/` dashboard
- `GET /api/products` — Supabase or seed
- `POST /api/ai-suggest` `{query, budget, items}` — smart plan
- `GET /api/export` — CSV report
