# Pappytackle 4×4 & Auto — Project Home

Read this first in any new session. It's the current-state front door — what's
live, what's deliberately unfinished, and where to find more detail. Keep it
updated at the end of any session that changes deployment state, adds a
deferred item, or resolves one.

## What this is

Marketing site for Pappytackle 4×4 & Auto (Lynden, WA), with Claude-powered
features (chat widget, diagnose-a-problem, booking-service suggester, smart
search). Astro 5 + React islands, deployed on Vercel. Built originally per
`docs/superpowers/plans/2026-05-23-pappytackle-site.md` and
`docs/superpowers/specs/2026-05-23-pappytackle-site-design.md` — those are the
original design intent, still accurate for overall architecture.

## Current state

- **Fully live** at `pappytackle.com` (and `www.pappytackle.com`, both
  resolve through Vercel — `www` is the canonical/redirect target). DNS
  cutover from the old WP Engine WordPress host is complete.
- `service@pappytackle.com` is verified in Resend; booking emails send from
  `bookings@pappytackle.com` to the real shop inbox.
- Vercel Web Analytics is enabled and confirmed recording pageviews.
- The old WordPress site/hosting (managed via "Mitchell") is fully
  cancelled — confirmed on the owner's billing, not just DNS-unreachable.
- Repo: `github.com/chancehenderson25-blip/Pappytackle-Site`, `main` branch,
  auto-deploys on push.
- Node/npm are installed locally now (weren't at project start).

## Deferred — intentionally not done, don't "fix" without checking first

- **Google Reviews API integration**: on hold until the owner's Google Ads
  account is updated. Decision made: seed real reviews manually once (into
  `src/data/reviews.ts`), then layer in an automated Places API sync later
  that appends new reviews without duplicating the manual seed (dedup by
  Google review timestamp + author). Not started yet.
- **Real shop photography**: About page (portrait + shop interior) and a few
  4×4 Builds gallery slots are still placeholder/`TodoBlock` entries.
- **6 sample reviews** in `src/data/reviews.ts` are marked `_isSample: true`
  — not real customer reviews yet.
- **No SPF record at the root domain** (`pappytackle.com` apex) — only at
  the `send` subdomain Resend uses. Doesn't affect the site, but weakens
  deliverability for mail sent directly from `service@pappytackle.com`.
  Pre-existing, not something this project's changes caused.

## Non-obvious current state (don't be surprised by these)

- AI endpoints are rate-limited via Upstash Redis: 20 requests/hour per IP,
  shared across all four `/api/ai/*` endpoints combined (not 20 each). See
  `src/lib/rateLimit.ts`. Fails open (unthrottled) if Upstash env vars are
  missing, so a misconfiguration can't accidentally block real customers.
- Chat input cap is 500 chars, but **only enforced on user-authored turns**
  (`src/lib/ai/schemas.ts`). Assistant replies in the conversation history can
  run longer (up to 4000) — a flat cap on every message would break multi-turn
  conversations, since prior assistant replies get resent as history on each
  new request.
- The booking endpoint's local-disk write (`data/appointments.local.json`) is
  best-effort only, wrapped so it can't fail the request — Vercel's
  serverless filesystem is read-only outside `/tmp`, so this was silently
  breaking bookings before the fix.
- Deploy adapter is `@astrojs/vercel` (v8 line — the project is on Astro 5,
  and `@astrojs/vercel` v11+ requires Astro 7). Don't blindly `npm install
  @astrojs/vercel@latest`.
- **For any new server-only env var (like `MAINTENANCE_MODE`), read it via
  `process.env.X` only — not `import.meta.env.X`.** For non-`PUBLIC_` vars,
  Vite statically resolves `import.meta.env.X` at build time using whatever
  environment the build runs in, which caused a real production crash
  (`raw.trim is not a function`) that Astro's local dev server didn't
  reproduce — dev mode and the actual built bundle handled it differently.
  `process.env.X` is always a live runtime lookup, no build-time surprises.
  When testing a new env-var-gated code path, verify against the actual
  compiled output in `.vercel/output/_functions/` (or equivalent), not just
  `astro dev` — dev mode is not a reliable stand-in for adapter build
  behavior.
- Vercel's env var UI has silently saved an empty value at least once
  (`BOOKINGS_TO_EMAIL` ended up blank despite the owner entering a value,
  causing a confusing downstream Resend error that looked unrelated). If a
  var-dependent feature misbehaves after a save, double-check the actual
  saved value in the dashboard before assuming the code is wrong.
- The shop **moved to Lynden** (230 Birch Bay Lynden Rd, Lynden, WA 98264) on
  2026-07-28; it was previously in Bellingham. The old Bellingham address
  still appears in `docs/superpowers/plans/` and `specs/` — those are
  historical build documents and were deliberately left alone. `shop.ts` is
  the only live source.
- The contact-page map **geocodes from `shop.address`** rather than hardcoded
  lat/lng, and `shop.geo` no longer exists. This was deliberate: coordinates
  are a fact that can't be guessed, and a stale/wrong pin sends real
  customers to the wrong place. If precise coordinates are ever wanted (for
  a `geo` field in the JSON-LD), get them from Google Maps — don't estimate.
- Saturday/Sunday are `open: null` with `note: 'By request'` in `shop.ts`.
  `src/lib/formatHours.ts` renders that as "by request" instead of "closed",
  and JSON-LD `openingHoursSpecification` correctly omits those days since
  they aren't regular hours.
- The site was accidentally left in maintenance mode (all real traffic
  seeing the 503 page, analytics recording nothing) for a stretch after a
  bug-fix redeploy, because it wasn't obvious the env var was still `true`.
  If analytics or traffic looks dead, check `MAINTENANCE_MODE` first.

## Taking the site down for maintenance

Set `MAINTENANCE_MODE=true` in Vercel (all environments) and trigger a
redeploy — env var changes don't apply to an already-built deployment, so
either push a commit or manually redeploy from the dashboard. Every route
except `/book`, `/book/thanks`, `/api/bookings`, and static assets gets
rewritten to `src/pages/maintenance.astro` (503 + Retry-After, noindex) via
`src/middleware.ts`. Booking stays reachable on purpose so leads aren't lost.
Set back to `false` (or remove the var) and redeploy to restore the site.

## Don't invent facts

This is a real business. Don't fabricate or guess at shop hours, pricing,
services offered, warranty terms, or customer/vehicle/repair details when
editing content or reviewing AI prompt behavior — check `src/data/shop.ts`,
`src/data/services.ts`, or ask the owner.

## Where things live

- Day-to-day content edits (hours, services, reviews, photos, builds): all of
  `src/data/*.ts` — see file-by-file breakdown in `HANDOFF.txt`.
- Session-by-session history of what changed and why: `docs/PROJECT_LOG.md`.
- Original build plan/spec: `docs/superpowers/plans/` and
  `docs/superpowers/specs/`.
- Deployment/API-key/env-var setup walkthrough: `HANDOFF.txt` (written for a
  non-developer doing the original handoff — still accurate for the initial
  setup steps, though some of it is now done; check "Current state" above for
  what's actually live).
