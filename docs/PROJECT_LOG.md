# Project Log

Running history of what changed and why, one entry per coherent work session.
Newest entries first. Not a commit-by-commit log (git already has that) — this
is for context git commits don't capture: decisions made, why, and what's
still open at the end of the session.

For current state and deferred work, see `CLAUDE.md` — this file is history,
that file is the current picture.

---

## 2026-08-02 — About page rebuilt three times, false credential claims fixed

**Fixed a real false-claims bug that had been sitting uncommitted.** The
site was stating "decade-plus of experience, ASE Certified" as fact in the
AI chat assistant's system prompt (meaning it was telling real customers
this), the default meta description on every page, and the certifications
badge strip (which also listed NAPA/O'Reilly/Synchrony Car Care — none
real). Owner is 24, self-taught, not ASE certified. Traced it to source,
fixed all three, added a guard in the AI prompt against restating it. This
fix had actually been made a session ago but never committed — caught it
sitting in the working tree while staging an unrelated change and shipped
it late rather than losing it.

**About page went through three full rewrites in one session**, each
correcting the one before:
1. First pass used personal stories the owner had told me for context only
   (his dad, a childhood dirt-bike rebuild) — he explicitly said these were
   never meant for the page, just background so I'd understand him. Pulled
   entirely.
2. Second pass ("fun, thrilling, tell people what we do") still carried
   over false facts from the original site copy — "over a decade of
   experience" and "ASE Certified" — because I hadn't verified them, just
   preserved what was already there. Owner corrected both directly.
3. Third pass, built from first principles with only verified facts: no
   invented tenure, self-taught background stated as lifelong aptitude
   without a number, no team bios (owner didn't want it reading as a
   name-drop), no customer quotes on this page (Reviews page already
   covers that). Two readability/tone audits followed and were
   implemented on top of this version — collapsed from 6 sections to 3,
   removed a repeated "we're honest" claim that appeared 3 different ways,
   swapped the headline from a hedge ("worst we can say is no") to a
   direct statement of identity, added a photo placeholder scoped as
   "Chance working in the shop" (candid) after he'd separately declined a
   posed self-portrait.

**Pattern worth naming**: multiple things went wrong here by silently
carrying forward unverified claims from the original site content instead
of checking them against what the owner had actually confirmed. Now fixed,
but worth remembering going forward — don't preserve a claim just because
it was already on the page.

## 2026-07-28 (cont'd) — Real Google reviews replace the fabricated ones

Owner exported their Google Business Profile reviews as 13 screenshots.
Transcribed **54 real reviews** verbatim into `src/data/reviews.ts`, removing
the six fabricated placeholders that had invented names, dates, and claims —
the last fabricated content on the site, and the thing most at odds with a
real business's reputation.

Reached this via screenshots rather than automation, and that was the right
call: Google's public Places API caps at 5 reviews regardless of setup, the
Business Profile API is gated behind an approval process, and scraping Maps
violates Google's ToS. Screenshots got all 54 in about ten minutes.

**Dates are approximate and the UI is honest about it.** Google's review list
shows only relative timestamps ("3 months ago"), so each date is derived
against 2026-07-28 and is accurate to roughly the month. The reviews page now
renders "Apr 2026" instead of a day-level date, so the display doesn't imply
precision the source never had.

**One transcription judgment worth recording.** I initially held back nine
reviews as "truncated behind Google's More link." The owner checked — that
link expands the services box, not the review text — so those were added in a
second pass. Only Peter Buetow's genuinely ends mid-sentence ("Everything was
completed …"); his is kept as an excerpt ending at the last complete sentence
rather than inventing the tail. Three reviews (Joey Perez, Krys R., Zarinah
Tyndall) have a star rating but no text and are excluded — nothing to quote.

`reviewStats` 36 → **57** (owner confirmed against the live profile). All 57
are 5-star, so the 5.0 average holds. 57 is the true Google total; 54 are
displayed, the difference being the three text-less ones.

**Site intentionally left in maintenance mode** — owner is holding the launch
until the remaining photography is done. Noted at the top of `CLAUDE.md` so a
future session doesn't read the 503 as an accident and switch it off.

## 2026-07-28 (cont'd) — Every image on the site was broken, then 28MB of them

Owner reported no photos or logos loading. Two distinct problems, the second
only visible after fixing the first.

**All images 404'd in production.** `/_image?href=...` returned "Not Found"
while the underlying `/_astro/*.png` served fine at 200 — so the files were
never the issue, Astro's image-optimization endpoint was. It doesn't work on
Vercel in server output (the deployed function can't read originals out of
the static output). It *does* work under `astro dev`, which is why nothing
caught it locally — same category of trap as the earlier `MAINTENANCE_MODE`
crash. Fixed with `vercel({ imageService: true })`, routing images through
Vercel's own optimization API.

**Then: the builds page was shipping 28MB.** Found while verifying the fix
rather than assuming it was done. `photos.ts` stored only `src.src` — the
resolved URL string — discarding the `ImageMetadata`, so `BuildGallery` had
nothing to optimize with and pointed `<img>` straight at 4000px originals.
Measured on production: 10 images, 30,226,414 bytes. `Photo` now carries
`ImageMetadata` and `builds.astro` runs each through `getImage()` for a 640px
grid thumbnail plus a 1920px lightbox version.

**Also: quality defaulted to 100.** `@astrojs/vercel`'s image service falls
back to `quality = 100` when unspecified, which additionally makes Vercel skip
WebP entirely at large widths. `IMAGE_QUALITY = 75` now lives in
`src/lib/imageDefaults.ts` and is applied at all seven `<Image>` call sites.

Measured on production, before → after:

- `/builds` gallery: 28 MB → 388 KB across 12 images, all WebP (~76x)
- Homepage hero: 2.75 MB JPEG → 374 KB WebP (~7x)

A separate small bug also fixed this session: `/_image` wasn't exempt from the
maintenance-mode rewrite, so the maintenance page's own logo 503'd — the
outage page rendered with a broken image. Reproduced by driving the compiled
middleware directly, since a local `.env` can't exercise that path (the toggle
reads `process.env`, and Vite loads `.env` into `import.meta.env`).

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
