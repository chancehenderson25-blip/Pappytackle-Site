# Project Log

Running history of what changed and why, one entry per coherent work session.
Newest entries first. Not a commit-by-commit log (git already has that) — this
is for context git commits don't capture: decisions made, why, and what's
still open at the end of the session.

For current state and deferred work, see `CLAUDE.md` — this file is history,
that file is the current picture.

---

## 2026-07-23 — Vercel launch, hardening, reviews sort, continuity docs

**Deployed the site.** Swapped `@astrojs/node` for `@astrojs/vercel` (v8 line,
matches Astro 5), pushed to a new GitHub repo
(`chancehenderson25-blip/Pappytackle-Site`), connected to Vercel. Live at
`pappytackle-site.vercel.app`. Custom domain `pappytackle.com` added in Vercel
but DNS still needs records added at GoDaddy by the owner's mentor (owner
doesn't have GoDaddy access).

**Anthropic API key**: rotated once after the owner accidentally pasted the
live key in a screenshot mid-session (treated as compromised, rotated
immediately). New key is in Vercel as `ANTHROPIC_API_KEY`.

**Booking emails**: wired up Resend. Found and fixed a real bug in the
process — the original booking endpoint wrote to local disk, which fails
silently on Vercel's read-only serverless filesystem. Made that write
best-effort/non-fatal, added the actual email send. `BOOKINGS_TO_EMAIL` is
temporarily the owner's personal Gmail (not `service@pappytackle.com`)
because Resend blocks sending to non-owner addresses until the sending domain
is verified, and domain verification is blocked on the same GoDaddy access
issue as the Vercel DNS.

**Rate limiting**: added Upstash Redis-backed rate limiting to all four AI
endpoints — 20 requests/hour per IP, shared across endpoints (chose this over
a naive in-memory counter because Vercel functions are stateless/ephemeral
and don't share memory across instances).

**Chat character limit**: added a cap after discussing it with the owner.
Started at 4000 (inherited default), talked it down to 500 for cost/UX
reasons. Caught and fixed a real bug before shipping: a flat 500-char cap on
every message in the array would have broken multi-turn conversations, since
the client resends prior assistant replies as history and those can exceed
500 chars. Cap now only applies to user-authored turns
(`src/lib/ai/schemas.ts`).

**Reviews page**: added sort controls (newest/oldest, highest/lowest rated)
alongside the existing star-rating filter. Discussed connecting real Google
reviews — concluded the public Places API caps out at 5 reviews max
regardless of automation, and scraping the full Google Maps listing to get
around that would violate Google's ToS. Decided: manually seed all real
reviews once, then layer in an automated API sync later that only appends new
ones (dedup by review timestamp + author) without touching the manual seed.
On hold until the owner's Google Ads account is updated — not started.

**Continuity docs**: owner asked to review a much larger/more complex sibling
project (a Codex-built document-generation app with a full multi-thread
governance system) for ideas on keeping Claude Code sessions oriented across
threads. Concluded most of that system solves a different problem (parallel
multi-agent coordination on an ambiguous product) that doesn't apply here
(one maintainer, one well-scoped site, sequential sessions). Adopted a scaled
-down version of its best idea: this file, plus `CLAUDE.md` as the
auto-loaded front door.

**Open at end of session**: Google Reviews API integration (not started, see
above), Resend domain verification (blocked on GoDaddy access), real shop
photos for About page + some Builds gallery slots, 6 sample reviews still
need replacing with real ones.
