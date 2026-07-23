# Pappytackle 4×4 & Auto — Project Home

Read this first in any new session. It's the current-state front door — what's
live, what's deliberately unfinished, and where to find more detail. Keep it
updated at the end of any session that changes deployment state, adds a
deferred item, or resolves one.

## What this is

Marketing site for Pappytackle 4×4 & Auto (Bellingham, WA), with Claude-powered
features (chat widget, diagnose-a-problem, booking-service suggester, smart
search). Astro 5 + React islands, deployed on Vercel. Built originally per
`docs/superpowers/plans/2026-05-23-pappytackle-site.md` and
`docs/superpowers/specs/2026-05-23-pappytackle-site-design.md` — those are the
original design intent, still accurate for overall architecture.

## Current state

- **Live** at `pappytackle-site.vercel.app`. Custom domain `pappytackle.com` is
  added in Vercel but DNS at GoDaddy still points to the old WP Engine
  WordPress site — DNS records need to be added by the owner's mentor, who
  controls GoDaddy access.
- Repo: `github.com/chancehenderson25-blip/Pappytackle-Site`, `main` branch,
  auto-deploys on push.
- Node/npm are installed locally now (weren't at project start).

## Deferred — intentionally not done, don't "fix" without checking first

- **Google Reviews API integration**: on hold until the owner's Google Ads
  account is updated. Decision made: seed real reviews manually once (into
  `src/data/reviews.ts`), then layer in an automated Places API sync later
  that appends new reviews without duplicating the manual seed (dedup by
  Google review timestamp + author). Not started yet.
- **Resend domain verification**: `pappytackle.com` isn't verified in Resend
  yet (blocked on the same GoDaddy access issue above). Until it is, Resend
  only allows sending to the account owner's own address.
- **Real shop photography**: About page (portrait + shop interior) and a few
  4×4 Builds gallery slots are still placeholder/`TodoBlock` entries.
- **6 sample reviews** in `src/data/reviews.ts` are marked `_isSample: true`
  — not real customer reviews yet.

## Non-obvious current state (don't be surprised by these)

- `BOOKINGS_TO_EMAIL` in Vercel is currently set to the owner's personal
  Gmail, **not** the real shop inbox (`service@pappytackle.com`) — temporary
  stand-in until the Resend domain verifies. Switch it once that's done.
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
