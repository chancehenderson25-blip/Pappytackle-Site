# Project Log

Running history of what changed and why, one entry per coherent work session.
Newest entries first. Not a commit-by-commit log (git already has that) — this
is for context git commits don't capture: decisions made, why, and what's
still open at the end of the session.

For current state and deferred work, see `CLAUDE.md` — this file is history,
that file is the current picture.

---

## 2026-07-28 (cont'd) — Content consistency pass, then shop address + hours change

**Proofreading pass** across every page and data file. Found and fixed: dead
deep links from the homepage "Recent Builds" cards to `/builds#<id>` (the
gallery used React's `key` prop, which isn't an HTML `id`, so no such element
existed); a shower emoji on the Exhaust service card; Oil Changes missing from
both the homepage grid and the footer.

Bigger theme was **duplicate sources of truth**: service names differed between
the services page, footer, booking dropdown, and booking email; the footer
hardcoded its own copy of the address/hours/certifications instead of reading
`shop.ts` (which also made "O'Reilly" render with two different apostrophes on
the same page); hours showed as "Mon 08:00–17:00" on contact but "Mon–Fri
8a–5p" in the footer. All now derive from `shop.ts`/`services.ts`, with a new
`src/lib/formatHours.ts` as the single hours formatter. Copyright year is
derived too.

**Shop moved to Lynden.** Address changed from 710 Sunset Pond Ln, Bellingham
to 230 Birch Bay Lynden Rd, Lynden, WA 98264. Hours changed from Mon–Fri
8a–5p to Mon–Fri 9:30a–6:30p, with weekends "by request" (new optional `note`
field on hours entries, since the old shape could only express open/closed).
Because the footer and page copy now derive from `shop.ts`, most of this was a
one-file change; the remaining edits were meta descriptions and the About-page
sentence that named the old street.

**Judgment call on the map:** the contact page previously used hardcoded
`geo` coordinates for an OpenStreetMap embed. Those were Bellingham's and
would have been wrong. I initially filled in estimated Lynden coordinates,
caught that this violated the project's own "don't invent facts" rule (a wrong
map pin sends real customers to the wrong place), and instead removed `geo`
entirely and switched the map to geocode from `shop.address`. Also dropped
`geo` from the JSON-LD rather than ship a guessed value — `address` is the
primary signal there anyway. Real coordinates can be added later from Google
Maps if a precise pin is wanted.

**Not verified:** the Google Maps embed renders correctly. The iframe is
lazy-loaded and the local browser pane couldn't composite a screenshot, so
the map should be eyeballed on the deployed contact page.

**Still open:** the sample reviews question (fabricated testimonials plus a
5.0/36 `aggregateRating` in the JSON-LD) and real photography.

## 2026-07-28 — Analytics, Resend verification, real bookings inbox live

**Vercel Web Analytics added.** Installed `@vercel/analytics`, added
`<Analytics />` to `BaseLayout.astro`. Owner enabled it in the Vercel
dashboard. First test was a false alarm — the site was still in
maintenance mode from the prior session's bug-fix cycle, and the standalone
maintenance page doesn't use `BaseLayout`, so nothing was being recorded.
Turned maintenance mode off; analytics confirmed working immediately after.

**Resend domain verification completed.** Owner verified `pappytackle.com`
in Resend after the DNS records (added last session) fully propagated.

**Booking emails now reach the real shop inbox.** Updated
`BOOKINGS_TO_EMAIL` to `service@pappytackle.com` and added
`BOOKINGS_FROM_EMAIL=bookings@pappytackle.com`. Hit a confusing detour first:
got a "domain not verified" error from Resend even though the dashboard
showed verified — turned out `BOOKINGS_TO_EMAIL` had silently saved as
empty in Vercel's UI (owner had entered a value, it didn't stick). Once
re-entered and redeployed, confirmed working with a real test booking.

**Old WordPress hosting cancelled.** Owner cancelled the subscription with
"Mitchell," who originally created/managed the old site — confirmed on
billing, so this is a real cancellation, not just DNS pointing elsewhere.

**Open at end of session**: same deferred content items as before (Google
Reviews API sync, real photos, real reviews), plus the pre-existing gap of
no SPF record at the root domain (only affects deliverability of mail sent
directly from `service@pappytackle.com`, not the site itself).

## 2026-07-23 (cont'd) — DNS cutover, maintenance mode, and a real production bug

**DNS cutover to Vercel completed.** Owner's mentor added the A record
(`@` → `216.198.79.1`, the actual value from Vercel's dashboard, not the
generic default docs suggest) and the four Resend verification records
(DKIM, MX, SPF, DMARC — DKIM verified as an exact character-for-character
match against Resend's dashboard before sending). `www.pappytackle.com` was
deliberately left pointing at the old WordPress host per owner's choice, so
it currently serves the *old* site while the apex serves the new one —
revisit if that becomes a problem.

**Added a maintenance-mode toggle** (`MAINTENANCE_MODE` env var +
`src/middleware.ts` + `src/pages/maintenance.astro`): gates the whole site
behind a branded "be right back" page except `/book`, `/book/thanks`, and
`/api/bookings`, so leads aren't lost during an outage.

**Shipped a real production bug** in the first version: checked
`import.meta.env.MAINTENANCE_MODE ?? process.env.MAINTENANCE_MODE`, verified
only against Astro's local dev server, and it crashed on Vercel
(`raw.trim is not a function`) — dev mode doesn't reproduce how Vite
statically resolves non-`PUBLIC_` `import.meta.env.X` vars at build time,
which behaved differently between the local build machine and Vercel's.
Fixed by reading `process.env` only (always a live runtime lookup) and
verified properly this time by executing the actual compiled
`.vercel/output/_functions/_astro-internal_middleware.mjs` directly via
Node with multiple env values and paths, not just `astro dev`. Lesson
captured in `CLAUDE.md` for any future env-var-gated code path.

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
