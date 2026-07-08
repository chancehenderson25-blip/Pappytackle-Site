# Pappytackle 4×4 & Auto

Marketing site for Pappytackle 4×4 & Auto (Bellingham, WA) with embedded Claude-powered features. Built with Astro 5, React islands, Tailwind v4, and the Anthropic TS SDK.

## Local setup

```bash
cp .env.example .env.local
# Open .env.local and add ANTHROPIC_API_KEY=sk-ant-...
npm install
npm run import-assets   # one-time — processes ~/Desktop/Pappytackle photography
npm run dev             # http://localhost:4321
```

`ANTHROPIC_API_KEY` is required for the four AI features (diagnose, suggest-service, chat, search). The rest of the site renders without it.

If `npm install` hits a cache permissions error: `npm install --cache /tmp/npm-cache`.

## Project structure

```
src/
├── pages/            # Astro pages + /api endpoints (server-rendered)
├── layouts/          # BaseLayout (nav + footer + chat mount + JSON-LD)
├── components/       # UI primitives + page sections + React islands
│   ├── chat/         # ChatWidget island (SSE streaming)
│   ├── builds/       # BuildGallery + Lightbox (React)
│   ├── services/     # DescribeBuildIsland (suggest-service entry)
│   ├── reviews/      # ReviewWall (filterable)
│   ├── book/         # BookingForm
│   ├── home/         # Hero, TwoPathSplit, ServiceGrid, RecentBuilds, etc.
│   └── seo/          # JsonLd (LocalBusiness + AutoRepair schema)
├── lib/ai/           # Anthropic SDK wrapper, Zod schemas, features
│   ├── client.ts          # SDK + retry helper
│   ├── shopContext.ts     # Cached system prompt
│   ├── schemas.ts         # All Zod input/output schemas
│   └── features/          # diagnose, suggestService, search, assistantReply
├── data/             # Flat TS — single source of truth
│   ├── shop.ts            # Name, address, phone, hours, certs
│   ├── services.ts        # 8 services with descriptions
│   ├── recentJobs.ts      # 14 real jobs (10 with photos, 4 awaiting)
│   ├── photos.ts          # 14 photo records with alt text
│   ├── builds.ts          # 6 featured 4×4 builds
│   └── reviews.ts         # 6 sample reviews (flagged _isSample)
├── assets/           # Processed photography + logos
└── styles/           # global.css (Tailwind v4 @theme tokens)

scripts/import-assets.sh   # Idempotent asset import from Desktop
tests/lib/ai/              # Vitest unit tests (mocked Anthropic SDK)
tests/e2e/                 # Playwright smoke per page
data/appointments.local.json  # Local-only booking sink (gitignored)
public/                    # Static assets (videos, favicon, og-default, robots)
```

## AI features

All four features live in `src/lib/ai/features/` and expose typed functions. Each has a matching API endpoint under `src/pages/api/ai/`. The shared shop context (`shopContext.ts`) is cached via Anthropic's prompt caching — one source of truth, reused across calls within the 5-minute TTL.

| Feature | Function | Endpoint | Model |
|---|---|---|---|
| Diagnose a symptom | `diagnose({ symptom, vehicle? })` | `POST /api/ai/diagnose` | claude-haiku-4-5 |
| Suggest a service from free text | `suggestService({ description })` | `POST /api/ai/suggest-service` | claude-haiku-4-5 |
| Search services + recent jobs | `search({ query })` | `POST /api/ai/search` | claude-haiku-4-5 |
| Streaming chat | `streamReply(messages)` | `POST /api/ai/chat` (SSE) | claude-sonnet-4-6 |

Tool-use forces structured output for diagnose/suggest/search; Zod validates the result before it leaves the lib. All errors fall back to a friendly "call us at (360) 543-6990" message client-side.

## Updating content

- **Services:** `src/data/services.ts`
- **Recent jobs:** `src/data/recentJobs.ts`
- **Builds (the showcase):** `src/data/builds.ts`
- **Reviews:** `src/data/reviews.ts` — flip or remove `_isSample: true` after pasting real verbatim review text.
- **Shop info (address, hours, phone, certs):** `src/data/shop.ts`

## Updating photography

1. Drop new files into `~/Desktop/Pappytackle/PHOTOS/<category>/`.
2. Add a line to `scripts/import-assets.sh` (JPG_MAP or HEIC_MAP).
3. Add an `import ... from '@/assets/photos/...'` plus a `Photo` entry in `src/data/photos.ts`.
4. Reference the new photo id from `builds.ts` or `recentJobs.ts`.

## Tests

```bash
npm test          # Vitest — unit tests for AI schema + each feature (mocked SDK)
npm run test:e2e  # Playwright — smoke each page renders + no console errors
npm run typecheck # Astro check across all .astro/.ts/.tsx files
npm run build     # Production build
```

## Before deploying

This pass is **local-dev only**. Before going live:

1. **Secrets:** move `ANTHROPIC_API_KEY` to the host env var (Netlify, Vercel, Fly). Never commit `.env.local`.
2. **Rate limiting:** add per-IP rate limiting on every `/api/ai/*` endpoint and `/api/bookings`. Suggested: Upstash Ratelimit (free tier, 10 r/min per IP per endpoint).
3. **Appointments sink:** replace `data/appointments.local.json` with email (Resend / Postmark) and/or CRM (whatever Chance uses).
4. **Reviews:** replace sample placeholders with real verbatim text from the shop's Google Business page; flip `_isSample` off.
5. **TODO imagery:** replace TODO blocks on About (Chance + shop interior) and 4×4 Builds (Sienna, Gladiator, Transit, Sierra) with real photography.
6. **Shop geo coordinates:** `src/data/shop.ts` `geo: { lat, lng }` is approximate Bellingham. Replace with the real shop location for the OpenStreetMap embed + JSON-LD.
7. **Site URL:** set `PUBLIC_SITE_URL` env var in production so `astro.config.mjs` `site:` field points at the real domain (drives canonical tags, sitemap URLs, OG `og:url`).
8. **Lighthouse:** run a full Lighthouse pass and fix any AA contrast / perf / SEO regressions.
9. **Streaming retry:** the retry wrapper on `anthropic.messages.stream()` is a no-op (the stream is initiated synchronously and errors surface during iteration). If reliability under transient network failures matters, add per-iteration error handling that surfaces a resumable error to the SSE client.
