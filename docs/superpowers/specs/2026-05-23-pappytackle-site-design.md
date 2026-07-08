# Pappytackle 4×4 & Auto — Site Design Spec

**Date:** 2026-05-23
**Owner:** Aidan Barton
**Client:** Chance, Pappytackle 4×4 & Auto (Bellingham, WA)
**Pitch context:** Family-friend exec at Blackmagic adjacent? No — separate. This is a real local-business marketing site with embedded AI features for the family friend's shop.

## 1. Goal

A production-quality marketing site for a Bellingham, WA auto repair shop that doubles as a custom 4×4 builder. Visually distinctive (heritage motor-club / enamel-badge aesthetic, NOT generic-blue auto template), built on real photography of real builds, with four embedded Claude-powered features (diagnose, suggest-service, chat, search). Local-development pass only — no production deploy config, no rate limiting code (both flagged for follow-up in the README).

## 2. Stack

- **Astro 5** with `output: 'server'` and the Node adapter (selective server rendering for AI endpoints; static for content pages).
- **TypeScript**, strict mode.
- **Tailwind CSS v4** via `@tailwindcss/vite`.
- **React islands** for interactivity — chat overlay, search box, booking form, diagnose & suggest-service widgets. Islands use `client:load` for the floating chat, `client:visible` elsewhere.
- **Framer Motion** inside React islands only (scroll reveals, hovers, page transitions).
- **Astro `<Image />`** (sharp) — auto WebP/AVIF + responsive `srcset`.
- **Anthropic TS SDK** (`@anthropic-ai/sdk`) — server-only.
- **Zod** for all AI response validation and form schemas.
- Single project, no monorepo.

Reasoning: mostly-content site (~7 pages) with 4 interactive AI features. Astro ships ~0 JS on content pages and lets AI surfaces opt-in as islands. SEO/JSON-LD and image optimization are first-class. Faster than Next for this shape, less framework noise.

## 3. Brand & Design System

### 3.1 Source brand (from `Pappytackle24_LogoGuide.pdf`)

Official palette and typeface, from the shop's logo guide:

| Token       | Hex       | Use                                           |
|-------------|-----------|-----------------------------------------------|
| `--ink`     | `#092837` | Primary dark surface, body text on light      |
| `--ink-2`   | `#0d3447` | Lifted dark surface (derived)                 |
| `--char`    | `#06202d` | Deepest dark sections (derived)               |
| `--ember`   | `#b72e26` | CTAs, accents, error                          |
| `--gold`    | `#dfa626` | Highlights, hover, premium 4×4 accents        |
| `--bone`    | `#d8d3bd` | Warm light surface, hero scrim                |
| `--paper`   | `#f5f2e8` | Lifted bone (derived) — main light background |

Direction: dark editorial. Deep navy/charcoal as primary canvas, bone/paper for breathing rooms, ember for CTAs, gold reserved for badges and 4×4-build callouts.

### 3.2 Typography

- **Display:** Big Shoulders Display (weights 700 / 900). Heavy, condensed, industrial — echoes vintage shop signage and license-plate stamps.
- **Body:** Open Sans (the brand's official typeface). 400 / 600 / 700.
- **Hero wordmark:** the existing Pappytackle script logo PNG (do not retype).
- Loaded via `@fontsource-variable/big-shoulders-display` and `@fontsource-variable/open-sans` (no Google Fonts CDN — keeps zero third-party requests).

Type scale (rem):
`0.75 · 0.875 · 1 · 1.125 · 1.25 · 1.5 · 1.875 · 2.25 · 3 · 3.75 · 4.5 · 6`

Body: 16/26 default. Long-form (About): 18/30. Display headings: tight tracking (-0.02em), uppercase by default.

### 3.3 Spacing & layout

- Spacing scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192` (px).
- Container max-widths: `prose` 65ch, `narrow` 720px, `default` 1200px, `wide` 1440px, `bleed` full.
- Radii: cards `12px`, buttons `6px`, badges `999px` (pill) or diamond clip-path for "badge" treatment.
- Shadows: minimal. Use ink borders (`1px solid color-mix(in oklch, var(--bone) 12%, transparent)`) on dark; subtle warm shadow `0 12px 32px -16px rgba(9,40,55,.25)` on light.

### 3.4 Component primitives

`Button` (variants: ember-primary, ghost-on-dark, ghost-on-light, gold-link) · `Card` · `BadgeDiamond` (clip-path diamond echoing the brand badges, used for cert and tier labels) · `SectionDark` / `SectionLight` · `Stat` · `Eyebrow` (label-caps) · `Divider` (tire-mark icon as separator) · `Lightbox` · `Lozenge` (call/book pills).

### 3.5 Motion

- Easing: `[0.25, 0.46, 0.45, 0.94]` matching Aidan's house default.
- Page transitions: cross-fade + 8px Y on `app:navigate` via Astro's view transitions API.
- Scroll reveal: opacity 0→1 + 16px translateY, single trigger, threshold 0.2. Capped to one element per fold; never per-line.
- Hero parallax: 0.3 ratio on background photo only.
- **Respect `prefers-reduced-motion`** globally — parallax and reveals become instant.

### 3.6 Accessibility

- WCAG AA contrast verified for every color pairing in the system (test the bone-on-ink and ember-on-bone combos explicitly).
- Semantic HTML — `<header>`, `<nav>`, `<main>`, `<article>`, `<section>` with proper headings hierarchy.
- Full keyboard nav, visible focus rings (gold outline on dark, ink outline on light).
- All photos have descriptive `alt` (vehicle + work type, e.g., "2017 Toyota Tacoma after 3-inch lift install").
- Form labels associated with inputs; error messages tied via `aria-describedby`.
- Chat overlay: focus-trap when open, ESC to close, role="dialog", `aria-label`.

## 4. Pages

Build in this order. Home first; ship each page before starting the next.

### 4.1 Home

- **Hero:** full-viewport. Background = Lexus GX long-travel still as poster, MP4 (`20250524_111526.mp4`) as muted autoplay loop overlay. Dark scrim gradient bottom→top for text legibility. H1 in Big Shoulders 900, ember underline accent. Sub: location + tagline. Two CTAs: ember **Book Appointment**, ghost **Call (360) 543-6990**.
- **Cert strip:** small monochrome row — ASE Certified · BBB · NAPA · O'Reilly · Synchrony Car Care.
- **Two-path value prop:** split section. Left card: "Honest auto repair." Right card: "Custom 4×4 builds." Each links into Services / 4×4 Builds.
- **Services highlights:** 6-up grid (Standard Maintenance, Engine & Diagnostics, Heating & A/C, Auto Electrical, Exhaust, Brakes). Each tile has icon + 1-line description.
- **Recent builds showcase:** 3 large cards — Lexus GX Long-Travel, Tacoma 3" Lift + Camper, Bronco Off-Road Lights. Hover reveals work summary.
- **Reviews band:** dark section, 3 review highlights with name + stars. (Sample placeholders flagged `_isSample`.)
- **CTA band:** ember background, "Book your appointment" + phone.
- **Floating chat button** present (global, not in this section spec).

### 4.2 4×4 Builds Gallery

The showpiece. Filterable: Lift Kits, Suspension, Long-Travel, Bumpers, Full Builds, All. Masonry grid with mixed aspect ratios. Click → lightbox with vehicle, work description, before/after if available. Initial builds from real recent jobs:

- Lexus GX long-travel build (5 photos)
- Toyota Tacoma 3" lift + camper
- Tacoma 16-shock rebuild
- Tacoma 17 bumper
- Bronco off-road lights
- Van exhaust work (×2)
- Toyota Sienna 3.5" lift install (text-only, no photo — labeled TODO image)
- Jeep Gladiator diff service (text-only, TODO)
- Ford Transit fuel injectors (text-only, TODO)
- GMC Sierra oil service (text-only, TODO)

### 4.3 Services

Single page, sectioned. Standard services: clean cards with description + typical turnaround language ("usually same-day", etc. — only where Chance can confirm). 4×4 customization gets a large premium section with inline build imagery, a tier breakdown (Bolt-on lift kits · Suspension upgrades · Long-travel builds · Bumpers & armor · Full builds), and a "Describe your build" entry that feeds `suggestService()`.

### 4.4 Book Appointment

Form fields: name (req), phone (req), email (opt), vehicle year/make/model (req), service category dropdown (req — pre-selected by `suggestService()` if arrived via problem-description entry), preferred date, preferred time window (Morning / Afternoon), notes textarea.

Submission writes to `data/appointments.local.json` (gitignored). Confirmation page shows what was sent and a "we'll call you back" note. README explicitly notes this needs to swap to email/CRM for production.

### 4.5 About / Meet Chance

Single-column, 720px max width, long-form. Vintage-newsprint vibe: paper background, large display headline, drop cap, photo placeholder block for Chance + shop interior (labeled TODOs). Copy themes: old-school service, local Bellingham, decade-plus experience, "ASE Certified", trust angle. Honest tone matching the real reviews. Cert badges at bottom.

### 4.6 Reviews

Full wall. Star rating + reviewer first name + date + body. Filterable by rating (5 / 4 / 3+). Data file `src/data/reviews.ts` — every entry has `_isSample: true` initially; flipping to `false` (or removing the flag) marks it real. The page itself does NOT label samples as "samples" visually (would look bad in design); the flag exists only in code, so Aidan can swap text in place.

### 4.7 Contact

- Embedded map (OpenStreetMap iframe — no API key needed, no Google Maps cost). Pin at 710 Sunset Pond Ln, Bellingham, WA 98226.
- Hours table (Mon–Fri 8a–5p, Sat–Sun closed).
- Big click-to-call button: `(360) 543-6990`.
- Directions button: deep-links Apple Maps on iOS, Google Maps otherwise.
- Short contact form (name, phone, message).

## 5. Global UI

### 5.1 Navigation

- Sticky top bar. Transparent over hero, solid `--ink` on scroll (300ms fade).
- Left: Tire Mark badge + Pappytackle wordmark.
- Center: Home · 4×4 Builds · Services · Reviews · About · Contact.
- Right: phone number (always visible, click-to-call), ember **Book** CTA.
- Mobile: hamburger drawer with same links + **Call** and **Book** as primary pills at top of drawer.

### 5.2 Footer

Three columns: (1) address + hours + phone, (2) services links, (3) socials + certifications row. Bottom strip: © 2026 Pappytackle 4×4 & Auto · Bellingham, WA.

### 5.3 Floating chat button

- Bottom-right, 56px ember pill with Tire Mark Yellow icon. 24px from edges.
- Opens overlay: full-height right-side sheet on desktop (max-width 480px), full-screen sheet on mobile.
- Header: "Ask Pappytackle". Close X. Suggested-prompt chips on first open: "Do you work on Jeeps?" · "What's a 3-inch lift on a Tacoma run?" · "Is the noise serious?"
- Body: message list with streamed assistant text. User input pinned to bottom.
- Streams via SSE from `/api/ai/chat`. Markdown rendering allowed (links, lists, bold). No HTML injection.

## 6. AI Module

### 6.1 Layout

```
src/lib/ai/
├── client.ts              # Anthropic client, retries, model constants
├── shopContext.ts         # SINGLE source of truth, cached prompt block
├── prompts/
│   ├── diagnose.ts
│   ├── suggestService.ts
│   ├── assistantReply.ts
│   └── search.ts
├── schemas.ts             # Zod schemas for every input + output
└── features/
    ├── diagnose.ts        # callDiagnose({symptom, vehicle?}) → DiagnoseResult
    ├── suggestService.ts  # callSuggest({description}) → SuggestServiceResult
    ├── assistantReply.ts  # streamReply(history) → AsyncIterable<string>
    └── search.ts          # callSearch({query}) → SearchResult[]

src/pages/api/ai/
├── diagnose.ts            # POST JSON → JSON
├── suggest-service.ts     # POST JSON → JSON
├── chat.ts                # POST JSON → text/event-stream
└── search.ts              # POST JSON → JSON
```

### 6.2 Models

| Feature        | Model                     | Why                                          |
|----------------|---------------------------|----------------------------------------------|
| diagnose       | `claude-haiku-4-5`        | Single-turn, structured, latency-sensitive   |
| suggestService | `claude-haiku-4-5`        | Single-turn classification                   |
| search         | `claude-haiku-4-5`        | Single-turn ranking over small JSON catalog  |
| assistantReply | `claude-sonnet-4-6`       | Personality + grounded multi-turn chat       |

### 6.3 Shop context (cached)

`shopContext.ts` exports a long system-prompt block containing: shop identity, location, hours, phone, services with descriptions, recent-jobs catalog, certifications, voice/tone rules ("warm, plainspoken, never alarmist, always defers to in-shop inspection for definitive diagnosis"). This block has a `cache_control: { type: 'ephemeral' }` breakpoint so the SDK reuses it across calls within the 5-minute TTL.

### 6.4 Feature contracts (Zod-validated)

```ts
DiagnoseResult = {
  severity: 'informational' | 'schedule_visit' | 'have_it_looked_at',
  likely_causes: { label: string, plain_explanation: string }[],
  safe_to_drive: boolean | 'unsure',
  suggested_service_category: ServiceCategory | null,
  next_step: string,             // always "have Chance take a look" framing
  disclaimer: string,            // standard non-alarmist disclaimer
}

SuggestServiceResult = {
  service_category: ServiceCategory,
  rationale: string,
  confidence: 'high' | 'medium' | 'low',
}

SearchResult = {
  kind: 'service' | 'recent_job',
  id: string,
  title: string,
  score: number,                 // 0..1
  reason: string,
  matchedTerms: string[],
}
```

Each feature uses Anthropic **tool use** to force structured output — Claude calls a tool whose `input_schema` mirrors the Zod schema; we read the tool input, validate with Zod, return.

### 6.5 Diagnose tone guardrail

- Prompt enforces: never use words like "dangerous", "urgent", "emergency", "critical".
- Always end with deferral to in-shop inspection.
- If `severity === 'schedule_visit'`, UI renders the **Book Appointment** CTA inline.
- If `severity === 'informational'`, no CTA — just info + "stop by if it gets worse".

### 6.6 Streaming chat

- `/api/ai/chat` returns `text/event-stream`. Each delta from Anthropic's streaming API forwarded as an SSE `data:` line.
- Client uses native `EventSource` or a fetch-stream reader (since EventSource doesn't allow POST, use `fetch` + `ReadableStream`).
- Abort on close. Hard 90-second timeout server-side.

### 6.7 Errors & retries

- 1 retry on 429 / 5xx with exponential backoff (1s, 2s).
- All AI errors return a friendly client-facing message ("Couldn't reach our assistant — give us a call at (360) 543-6990 and we'll help directly").
- Logged server-side via `console.error` with redacted prompt previews (no PII).

## 7. Data files (single source of truth)

```
src/data/
├── shop.ts          # name, address, phone, hours, certs
├── services.ts      # Service[] with id, name, summary, body, category
├── recentJobs.ts    # RecentJob[] — vehicle, work, photoIds[]
├── photos.ts        # Photo[] — id, src, alt, category, vehicle?, buildId?
├── reviews.ts       # Review[] — rating, name, date, body, _isSample
└── builds.ts        # Build[] — featured 4×4 builds with photoIds[]
```

All flat TS. No CMS. Matches Aidan's Portfolio-next pattern.

## 8. Asset pipeline

### 8.1 Source inventory

**Logos** (`~/Desktop/Pappytackle/PAPPYTACKLE LOGO PNGS/`):
- 4 mark types (Logo, Full logo, Tire Mark, Badge) × multiple colorways. PNG only.

**Photos** (`~/Desktop/Pappytackle/PHOTOS/`):
- 14 stills (12 JPG, 4 HEIC) + 1 MP4.
- Categories: BRONCOS, EXHAUST, LEXUS GX, TACOMAS, VANS.

### 8.2 Import script

`scripts/import-assets.sh`:
1. Convert all HEIC to JPEG (q=90) via macOS `sips`.
2. Strip EXIF metadata (keeps file sizes reasonable, prevents location leak).
3. Rename to kebab-case with category prefix.
4. Copy into `src/assets/photos/{category}/`.
5. Copy chosen logo variants into `src/assets/logos/` (Navy Logo, Beige Logo, Navy Full Logo, Beige Full Logo, Yellow Tire Mark, Navy Tire Mark, Navy Badge, Multi-Beige Badge).
6. Transcode the LEXUS GX MP4 to web-friendly H.264 + WebM via `ffmpeg` (if installed; warn and skip otherwise).

Idempotent — safe to re-run.

### 8.3 Naming map

| Source                                         | Destination                                              |
|------------------------------------------------|----------------------------------------------------------|
| `LEXUS GX/0001 LEXUS LONG TRAVEL.jpg`          | `photos/lexus-gx/long-travel-01.jpg`                     |
| `LEXUS GX/0001 LEXUS LONG TRAVEL 2/3/4.jpg`    | `photos/lexus-gx/long-travel-02/03/04.jpg`               |
| `LEXUS GX/0002 LEXUS KINGS_TC.jpg`             | `photos/lexus-gx/kings-shocks.jpg`                       |
| `LEXUS GX/20250524_111526.mp4`                 | `videos/lexus-gx-hero.mp4` + `.webm`                     |
| `TACOMAS/TACOLEVEL.jpg`                        | `photos/tacomas/leveled-01.jpg`                          |
| `TACOMAS/TACOLEVEL_LIFTCAMPER.jpg`             | `photos/tacomas/lift-camper.jpg`                         |
| `TACOMAS/0001 17TACOBUMPER.jpg`                | `photos/tacomas/2017-bumper.jpg`                         |
| `TACOMAS/0002 16TACOSHOCKREBUILD.jpg`          | `photos/tacomas/2016-shock-rebuild.jpg`                  |
| `BRONCOS/BRONCRACK_LIGHTS.jpg`                 | `photos/broncos/light-bar.jpg`                           |
| `EXHAUST/VAN EXHAUST.heic`                     | `photos/exhaust/van-exhaust-01.jpg`                      |
| `EXHAUST/20250908_155737.heic`                 | `photos/exhaust/exhaust-02.jpg`                          |
| `VANS/20250908_155720.heic`                    | `photos/vans/van-01.jpg`                                 |
| `VANS/20250908_155731.heic`                    | `photos/vans/van-02.jpg`                                 |

### 8.4 Optimization

Astro's `<Image />` produces WebP + AVIF + responsive `srcset`. Hero images get explicit `widths={[640, 960, 1280, 1920, 2560]}`, gallery thumbs `[400, 600, 800]`, lightbox `[1200, 1800, 2400]`. `loading="lazy"` everywhere except above-the-fold hero.

### 8.5 Missing imagery (TODO blocks)

Rendered as labeled placeholder components (dark card with diamond badge "TODO: shop interior"), NOT invented stock:
- Shop exterior
- Shop interior / Chance at work
- Portrait of Chance
- Sienna 3.5" lift install
- Jeep Gladiator diff service
- Ford Transit fuel injectors
- GMC Sierra oil service

## 9. SEO

- Per-page metadata (title, description, OG image, canonical).
- OG images: use hero photos for most pages; About uses badge logo.
- `sitemap.xml` via `@astrojs/sitemap`.
- `robots.txt` allowing all.
- **JSON-LD on every page**:
  - LocalBusiness + AutoRepair (root layout): name, address, phone, hours, geo, priceRange, sameAs (socials).
  - Service schema per service page entry.
  - Review schema aggregating Reviews page (once samples are replaced).
  - BreadcrumbList on inner pages.
- Page titles: `${page} · Pappytackle 4×4 & Auto · Bellingham, WA`.

## 10. Env & local dev

`.env.example`:
```
ANTHROPIC_API_KEY=
PUBLIC_SHOP_PHONE=3605436990
PUBLIC_SHOP_ADDRESS_LINE1=710 Sunset Pond Ln
PUBLIC_SHOP_CITY=Bellingham
PUBLIC_SHOP_STATE=WA
PUBLIC_SHOP_ZIP=98226
```

`.env.local` (gitignored) holds the real Anthropic key. README walks setup.

## 11. README structure

```
# Pappytackle 4×4 & Auto
## Local setup
  1. cp .env.example .env.local
  2. Add ANTHROPIC_API_KEY
  3. npm install
  4. npm run import-assets   # one-time, processes Desktop/Pappytackle
  5. npm run dev
## Project structure
## AI features
## Updating content (data files)
## Updating photography
## Before deploying
  - Move ANTHROPIC_API_KEY to host env (Netlify / Vercel / Fly)
  - Add rate limiting on /api/ai/* (per-IP, e.g., Upstash Ratelimit)
  - Replace appointments.local.json sink with email/CRM
  - Replace sample reviews (flip _isSample flags or remove)
  - Add shop exterior / interior / Chance portraits where TODO blocks remain
  - Run Lighthouse, fix any AA contrast or perf regressions
```

## 12. Explicit non-goals (this pass)

- No production deploy config.
- No rate limiting code.
- No CMS.
- No analytics.
- No e-commerce.
- No invented review text — sample placeholders only, flagged in code.
- No "verified live feed" widget — reviews presented as static testimonials.
- No embeddings — single Claude call powers search over the small catalog.

## 13. Open follow-ups (post-this-pass)

- Real reviews paste-in (Aidan).
- Shop / Chance photography session (Chance).
- Production deploy with rate limiting (next pass).
- Stripe-based deposit on booking? (out of scope — flag for v2).
- Service-area schema / location landing pages for nearby towns (Ferndale, Lynden) — SEO v2.
