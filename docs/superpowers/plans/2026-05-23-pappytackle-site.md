# Pappytackle 4×4 & Auto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a production-quality marketing site for Pappytackle 4×4 & Auto with embedded Claude-powered features (diagnose, suggest-service, chat, search), built on real shop photography.

**Architecture:** Astro 5 (server adapter) with React islands for AI surfaces. Anthropic SDK runs server-only via `/api/ai/*` endpoints with prompt caching on a shared shop-context block. Flat TS data files (no CMS). Brand-derived design system (Big Shoulders Display + Open Sans, official 4-color palette).

**Tech Stack:** Astro 5 · TypeScript · Tailwind CSS v4 · React 18 (islands) · Framer Motion · Anthropic TS SDK · Zod · Sharp (via `@astrojs/image`)

**Spec:** `docs/superpowers/specs/2026-05-23-pappytackle-site-design.md` — refer to it freely; this plan implements it.

---

## Phase 0 — Scaffolding

### Task 1: Initialize Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.env.example`

- [ ] **Step 1: Scaffold Astro skeleton manually (no `create-astro` wizard — controlled deps)**

In `~/Pappytackle-site/`, create `package.json`:

```json
{
  "name": "pappytackle-site",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "import-assets": "bash scripts/import-assets.sh",
    "typecheck": "astro check",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Install runtime + dev deps**

```bash
cd ~/Pappytackle-site
npm install --cache /tmp/npm-cache astro@^5 @astrojs/node@^9 @astrojs/react@^4 @astrojs/sitemap@^3 react@^18 react-dom@^18 @anthropic-ai/sdk@^0.40 zod@^3 framer-motion@^11 tailwindcss@^4 @tailwindcss/vite@^4 @fontsource-variable/big-shoulders-display @fontsource-variable/open-sans
npm install --cache /tmp/npm-cache -D typescript @types/react @types/react-dom vitest @vitest/ui happy-dom @playwright/test
```

- [ ] **Step 3: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'http://localhost:4321',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  image: { domains: [] },
});
```

- [ ] **Step 4: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*", "astro.config.mjs"]
}
```

- [ ] **Step 5: Write `.gitignore` and `.env.example`**

`.gitignore`:
```
node_modules
dist
.astro
.env
.env.local
.DS_Store
data/appointments.local.json
playwright-report
test-results
/tmp
```

`.env.example`:
```
ANTHROPIC_API_KEY=
PUBLIC_SHOP_PHONE=3605436990
PUBLIC_SHOP_ADDRESS_LINE1=710 Sunset Pond Ln
PUBLIC_SHOP_CITY=Bellingham
PUBLIC_SHOP_STATE=WA
PUBLIC_SHOP_ZIP=98226
```

- [ ] **Step 6: Verify Astro boots**

```bash
mkdir -p src/pages
printf -- '---\n---\n<h1>boot ok</h1>' > src/pages/index.astro
npm run dev -- --port 4321 &
sleep 4
curl -s http://localhost:4321 | grep -c "boot ok"
kill %1
```
Expected: `1`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro project + deps"
```

### Task 2: Asset import script

**Files:**
- Create: `scripts/import-assets.sh`
- Create: `src/assets/photos/.gitkeep`, `src/assets/logos/.gitkeep`, `src/assets/videos/.gitkeep`

- [ ] **Step 1: Write `scripts/import-assets.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

SRC="$HOME/Desktop/Pappytackle"
DEST_PHOTOS="src/assets/photos"
DEST_LOGOS="src/assets/logos"
DEST_VIDEOS="src/assets/videos"

if [ ! -d "$SRC" ]; then
  echo "Source not found: $SRC" >&2
  exit 1
fi

mkdir -p "$DEST_PHOTOS"/{lexus-gx,tacomas,broncos,exhaust,vans} "$DEST_LOGOS" "$DEST_VIDEOS"

convert_jpeg() {
  local src="$1" dest="$2"
  if [ ! -f "$dest" ]; then
    sips -s format jpeg -s formatOptions 90 "$src" --out "$dest" >/dev/null
    # strip EXIF
    sips -d all "$dest" >/dev/null 2>&1 || true
  fi
}

copy_logo() {
  local src="$1" dest="$2"
  [ -f "$dest" ] || cp "$src" "$dest"
}

# Photos — JPGs (just copy + rename + strip exif)
declare -a JPG_MAP=(
  "PHOTOS/LEXUS GX/0001 LEXUS LONG TRAVEL.jpg::lexus-gx/long-travel-01.jpg"
  "PHOTOS/LEXUS GX/0001 LEXUS LONG TRAVEL2.jpg::lexus-gx/long-travel-02.jpg"
  "PHOTOS/LEXUS GX/0001 LEXUS LONG TRAVEL 3.jpg::lexus-gx/long-travel-03.jpg"
  "PHOTOS/LEXUS GX/0001 LEXUS LONG TRAVEL 4.jpg::lexus-gx/long-travel-04.jpg"
  "PHOTOS/LEXUS GX/0002 LEXUS KINGS_TC.jpg::lexus-gx/kings-shocks.jpg"
  "PHOTOS/TACOMAS/TACOLEVEL.jpg::tacomas/leveled-01.jpg"
  "PHOTOS/TACOMAS/TACOLEVEL_LIFTCAMPER.jpg::tacomas/lift-camper.jpg"
  "PHOTOS/TACOMAS/0001 17TACOBUMPER.jpg::tacomas/2017-bumper.jpg"
  "PHOTOS/TACOMAS/0002 16TACOSHOCKREBUILD.jpg::tacomas/2016-shock-rebuild.jpg"
  "PHOTOS/BRONCOS/BRONCRACK_LIGHTS.jpg::broncos/light-bar.jpg"
)

for entry in "${JPG_MAP[@]}"; do
  src="$SRC/${entry%%::*}"
  dst="$DEST_PHOTOS/${entry##*::}"
  [ -f "$src" ] && convert_jpeg "$src" "$dst" || echo "Missing: $src"
done

# HEICs → JPEG
declare -a HEIC_MAP=(
  "PHOTOS/EXHAUST/VAN EXHAUST.heic::exhaust/van-exhaust-01.jpg"
  "PHOTOS/EXHAUST/20250908_155737.heic::exhaust/exhaust-02.jpg"
  "PHOTOS/VANS/20250908_155720.heic::vans/van-01.jpg"
  "PHOTOS/VANS/20250908_155731.heic::vans/van-02.jpg"
)

for entry in "${HEIC_MAP[@]}"; do
  src="$SRC/${entry%%::*}"
  dst="$DEST_PHOTOS/${entry##*::}"
  [ -f "$src" ] && convert_jpeg "$src" "$dst" || echo "Missing: $src"
done

# Logos
declare -a LOGO_MAP=(
  "PAPPYTACKLE LOGO PNGS/01 Logo/png/Pappytacke_Logo_Navy_RGB.png::logo-navy.png"
  "PAPPYTACKLE LOGO PNGS/01 Logo/png/Pappytacke_Logo_Beige_RGB.png::logo-beige.png"
  "PAPPYTACKLE LOGO PNGS/02 Full logo/png/Pappytacke_Logo_Navy_RGB.png::logo-full-navy.png"
  "PAPPYTACKLE LOGO PNGS/02 Full logo/png/Pappytacke_Logo_Beige_RGB.png::logo-full-beige.png"
  "PAPPYTACKLE LOGO PNGS/03 Tire Mark/png/Pappytacke_TireMark_Yellow_RGB.png::tire-mark-yellow.png"
  "PAPPYTACKLE LOGO PNGS/03 Tire Mark/png/Pappytacke_TireMark_Navy_RGB.png::tire-mark-navy.png"
  "PAPPYTACKLE LOGO PNGS/04 Badge/png/Pappytacke_Badge_Logo_Navy_RGB.png::badge-navy.png"
  "PAPPYTACKLE LOGO PNGS/04 Badge/png/Pappytacke_Badge_Logo_MultiBeige_RGB.png::badge-multi-beige.png"
)

for entry in "${LOGO_MAP[@]}"; do
  src="$SRC/${entry%%::*}"
  dst="$DEST_LOGOS/${entry##*::}"
  [ -f "$src" ] && copy_logo "$src" "$dst" || echo "Missing: $src"
done

# Video — transcode if ffmpeg available
VID_SRC="$SRC/PHOTOS/LEXUS GX/20250524_111526.mp4"
if [ -f "$VID_SRC" ]; then
  if command -v ffmpeg >/dev/null; then
    [ -f "$DEST_VIDEOS/lexus-gx-hero.mp4" ] || \
      ffmpeg -y -i "$VID_SRC" -an -vf "scale=1920:-2" -c:v libx264 -crf 24 -preset slow -movflags +faststart "$DEST_VIDEOS/lexus-gx-hero.mp4" -loglevel error
    [ -f "$DEST_VIDEOS/lexus-gx-hero.webm" ] || \
      ffmpeg -y -i "$VID_SRC" -an -vf "scale=1920:-2" -c:v libvpx-vp9 -crf 32 -b:v 0 "$DEST_VIDEOS/lexus-gx-hero.webm" -loglevel error
  else
    echo "ffmpeg not found — copying MP4 as-is (large file)"
    cp -n "$VID_SRC" "$DEST_VIDEOS/lexus-gx-hero.mp4"
  fi
fi

echo "Asset import complete."
ls -la "$DEST_PHOTOS" "$DEST_LOGOS" "$DEST_VIDEOS"
```

- [ ] **Step 2: Make executable and run**

```bash
chmod +x scripts/import-assets.sh
npm run import-assets
```
Expected: lists imported files; no "Missing:" lines for the photo/logo paths above.

- [ ] **Step 3: Verify file count**

```bash
find src/assets/photos -name "*.jpg" | wc -l    # expect 14
find src/assets/logos -name "*.png" | wc -l     # expect 8
```

- [ ] **Step 4: Commit**

```bash
git add scripts/ src/assets/
git commit -m "feat: asset import script + processed photography & logos"
```

### Task 3: Design tokens (Tailwind v4)

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Write `src/styles/global.css`**

```css
@import "tailwindcss";
@import "@fontsource-variable/big-shoulders-display";
@import "@fontsource-variable/open-sans";

@theme {
  /* Brand palette (from logo guide) */
  --color-ink: #092837;
  --color-ink-2: #0d3447;
  --color-char: #06202d;
  --color-ember: #b72e26;
  --color-ember-dark: #921f1a;
  --color-gold: #dfa626;
  --color-gold-light: #ecc065;
  --color-bone: #d8d3bd;
  --color-paper: #f5f2e8;

  /* Type */
  --font-display: "Big Shoulders Display Variable", system-ui, sans-serif;
  --font-body: "Open Sans Variable", system-ui, sans-serif;

  /* Radii */
  --radius-card: 12px;
  --radius-button: 6px;
}

@layer base {
  html { color-scheme: dark; }
  body {
    font-family: var(--font-body);
    background: var(--color-paper);
    color: var(--color-ink);
    font-size: 16px;
    line-height: 1.625;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, h4 {
    font-family: var(--font-display);
    font-weight: 900;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    line-height: 1.05;
  }
  :focus-visible {
    outline: 2px solid var(--color-gold);
    outline-offset: 3px;
    border-radius: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer components {
  .eyebrow {
    font-family: var(--font-body);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.75rem;
    color: var(--color-gold);
  }
  .container-default { max-width: 1200px; margin-inline: auto; padding-inline: 1.5rem; }
  .container-wide { max-width: 1440px; margin-inline: auto; padding-inline: 1.5rem; }
  .container-narrow { max-width: 720px; margin-inline: auto; padding-inline: 1.5rem; }
  .container-prose { max-width: 65ch; margin-inline: auto; padding-inline: 1.5rem; }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/
git commit -m "feat: brand-derived design tokens via tailwind v4"
```

### Task 4: Root layout + nav + footer

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/SiteNav.astro`
- Create: `src/components/SiteFooter.astro`
- Create: `src/components/CallButton.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Write `src/components/CallButton.astro`**

```astro
---
interface Props {
  variant?: 'primary' | 'ghost' | 'compact';
  class?: string;
}
const { variant = 'ghost', class: cls = '' } = Astro.props;
const phone = import.meta.env.PUBLIC_SHOP_PHONE ?? '3605436990';
const display = `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;
const base = 'inline-flex items-center gap-2 px-4 py-2.5 font-display font-bold uppercase tracking-wide rounded-[var(--radius-button)] transition-colors';
const variants = {
  primary: 'bg-[var(--color-ember)] text-[var(--color-paper)] hover:bg-[var(--color-ember-dark)]',
  ghost: 'border border-[var(--color-bone)]/30 text-[var(--color-paper)] hover:bg-[var(--color-bone)]/10',
  compact: 'text-[var(--color-paper)] hover:text-[var(--color-gold)]',
};
---
<a href={`tel:+1${phone}`} class={`${base} ${variants[variant]} ${cls}`} aria-label={`Call Pappytackle at ${display}`}>
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  <span>{display}</span>
</a>
```

- [ ] **Step 2: Write `src/components/SiteNav.astro`**

```astro
---
import { Image } from 'astro:assets';
import logoBeige from '@/assets/logos/logo-full-beige.png';
import logoNavy from '@/assets/logos/logo-full-navy.png';
import CallButton from './CallButton.astro';

const links = [
  { href: '/', label: 'Home' },
  { href: '/builds', label: '4×4 Builds' },
  { href: '/services', label: 'Services' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];
const path = Astro.url.pathname;
---
<header id="site-nav" class="fixed inset-x-0 top-0 z-40 transition-colors duration-300" data-scrolled="false">
  <div class="container-wide flex items-center justify-between py-4">
    <a href="/" class="flex items-center gap-3" aria-label="Pappytackle home">
      <Image src={logoBeige} alt="Pappytackle 4×4 & Auto" width={160} height={48} class="h-10 w-auto data-scrolled:hidden" loading="eager" />
      <Image src={logoNavy} alt="Pappytackle 4×4 & Auto" width={160} height={48} class="h-10 w-auto hidden" id="logo-scrolled" loading="eager" />
    </a>
    <nav class="hidden md:flex items-center gap-6" aria-label="Primary">
      {links.map(l => (
        <a href={l.href} class={`font-display font-bold uppercase tracking-wide text-sm transition-colors ${path === l.href ? 'text-[var(--color-gold)]' : 'text-[var(--color-paper)] hover:text-[var(--color-gold)]'}`}>{l.label}</a>
      ))}
    </nav>
    <div class="hidden md:flex items-center gap-3">
      <CallButton variant="compact" />
      <a href="/book" class="inline-flex items-center px-4 py-2.5 bg-[var(--color-ember)] text-[var(--color-paper)] font-display font-bold uppercase rounded-[var(--radius-button)] hover:bg-[var(--color-ember-dark)] transition-colors">Book</a>
    </div>
    <button class="md:hidden text-[var(--color-paper)]" aria-label="Open menu" id="nav-toggle">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
    </button>
  </div>
  <div id="mobile-menu" class="hidden md:hidden bg-[var(--color-ink)] border-t border-[var(--color-bone)]/15">
    <div class="container-default flex flex-col gap-1 py-4">
      <a href="/book" class="block px-4 py-3 bg-[var(--color-ember)] text-[var(--color-paper)] font-display font-bold uppercase rounded-[var(--radius-button)] text-center">Book Appointment</a>
      <CallButton variant="primary" class="!justify-center" />
      {links.map(l => <a href={l.href} class="block px-4 py-3 font-display font-bold uppercase text-[var(--color-paper)] hover:bg-[var(--color-ink-2)] rounded">{l.label}</a>)}
    </div>
  </div>
</header>
<script>
  const nav = document.getElementById('site-nav')!;
  const onScroll = () => {
    const scrolled = window.scrollY > 40;
    nav.dataset.scrolled = String(scrolled);
    nav.style.background = scrolled ? 'var(--color-ink)' : 'transparent';
    nav.style.borderBottom = scrolled ? '1px solid rgba(216,211,189,0.12)' : 'none';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  document.getElementById('nav-toggle')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
  });
</script>
```

- [ ] **Step 3: Write `src/components/SiteFooter.astro`**

```astro
---
import CallButton from './CallButton.astro';
const certs = ['ASE Certified', 'BBB', 'NAPA', 'O’Reilly', 'Synchrony Car Care'];
const services = [
  ['/services#maintenance', 'Standard Maintenance'],
  ['/services#diagnostics', 'Engine & Diagnostics'],
  ['/services#hvac', 'Heating & A/C'],
  ['/services#electrical', 'Auto Electrical'],
  ['/services#exhaust', 'Exhaust'],
  ['/services#brakes', 'Brakes'],
  ['/services#4x4', '4×4 Customization'],
];
---
<footer class="bg-[var(--color-char)] text-[var(--color-paper)] border-t border-[var(--color-bone)]/10">
  <div class="container-default grid gap-12 py-16 md:grid-cols-3">
    <div>
      <h3 class="eyebrow mb-4">Visit</h3>
      <address class="not-italic leading-relaxed">
        Pappytackle 4×4 &amp; Auto<br/>
        710 Sunset Pond Ln<br/>
        Bellingham, WA 98226
      </address>
      <p class="mt-4">Mon–Fri 8a–5p<br/>Sat &amp; Sun closed</p>
      <div class="mt-6"><CallButton variant="primary" /></div>
    </div>
    <div>
      <h3 class="eyebrow mb-4">Services</h3>
      <ul class="space-y-2">
        {services.map(([h, l]) => <li><a href={h} class="hover:text-[var(--color-gold)] transition-colors">{l}</a></li>)}
      </ul>
    </div>
    <div>
      <h3 class="eyebrow mb-4">Trusted by</h3>
      <ul class="flex flex-wrap gap-2">
        {certs.map(c => <li class="px-3 py-1 border border-[var(--color-bone)]/25 rounded-full text-sm">{c}</li>)}
      </ul>
    </div>
  </div>
  <div class="border-t border-[var(--color-bone)]/10 py-6 text-center text-sm text-[var(--color-bone)]/70">
    © 2026 Pappytackle 4×4 &amp; Auto · Bellingham, WA
  </div>
</footer>
```

- [ ] **Step 4: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '@/styles/global.css';
import SiteNav from '@/components/SiteNav.astro';
import SiteFooter from '@/components/SiteFooter.astro';

interface Props {
  title: string;
  description?: string;
  ogImage?: string;
  navOver?: boolean; // true on home (transparent nav over hero)
}
const { title, description = 'Honest auto repair and custom 4×4 builds in Bellingham, WA. ASE Certified. 5.0 across 36+ reviews.', ogImage = '/og-default.jpg', navOver = false } = Astro.props;
const fullTitle = `${title} · Pappytackle 4×4 & Auto · Bellingham, WA`;
const canonical = new URL(Astro.url.pathname, Astro.site ?? 'http://localhost:4321').href;
---
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:type" content="website" />
  <meta name="theme-color" content="#092837" />
  <link rel="icon" type="image/png" href="/favicon.png" />
</head>
<body class={navOver ? '' : 'pt-20'}>
  <SiteNav />
  <main id="main">
    <slot />
  </main>
  <SiteFooter />
</body>
</html>
```

- [ ] **Step 5: Replace `src/pages/index.astro` with a layout smoke**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
---
<BaseLayout title="Home" navOver={true}>
  <section class="min-h-screen bg-[var(--color-ink)] text-[var(--color-paper)] grid place-items-center">
    <h1 class="text-6xl">Pappytackle Boot Test</h1>
  </section>
</BaseLayout>
```

- [ ] **Step 6: Verify layout renders**

```bash
npm run dev -- --port 4321 &
sleep 4
curl -s http://localhost:4321 | grep -c "Pappytackle 4×4 & Auto · Bellingham"
kill %1
```
Expected: `≥ 2` (in title and nav)

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: base layout with sticky nav, footer, click-to-call"
```

---

## Phase 1 — Data & AI Core

### Task 5: Data files

**Files:**
- Create: `src/data/shop.ts`, `services.ts`, `recentJobs.ts`, `reviews.ts`, `builds.ts`, `photos.ts`, `types.ts`

- [ ] **Step 1: Write `src/data/types.ts`**

```ts
export type ServiceCategory =
  | 'maintenance' | 'diagnostics' | 'hvac' | 'electrical'
  | 'exhaust' | 'brakes' | 'oil_change' | '4x4_custom';

export interface Service {
  id: string;
  category: ServiceCategory;
  name: string;
  summary: string;
  body: string;
}

export interface RecentJob {
  id: string;
  vehicle: string;     // e.g. "2017 Toyota Tacoma"
  work: string;        // e.g. "3-inch lift install"
  category: ServiceCategory;
  photoIds: string[];
}

export interface Photo {
  id: string;
  category: 'lexus-gx' | 'tacomas' | 'broncos' | 'exhaust' | 'vans';
  src: string;         // import path
  alt: string;
  width: number;
  height: number;
}

export interface Review {
  id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  name: string;
  date: string;        // YYYY-MM-DD
  body: string;
  _isSample?: boolean;
}

export interface Build {
  id: string;
  title: string;
  vehicle: string;
  summary: string;
  category: 'lift' | 'suspension' | 'long-travel' | 'bumper' | 'full';
  photoIds: string[];
}
```

- [ ] **Step 2: Write `src/data/shop.ts`**

```ts
export const shop = {
  name: 'Pappytackle 4×4 & Auto',
  owner: 'Chance',
  address: {
    line1: '710 Sunset Pond Ln',
    city: 'Bellingham',
    state: 'WA',
    zip: '98226',
  },
  geo: { lat: 48.7951, lng: -122.4862 },  // approx — Bellingham; replace with real if known
  phone: '3605436990',
  hours: [
    { day: 'Mon', open: '08:00', close: '17:00' },
    { day: 'Tue', open: '08:00', close: '17:00' },
    { day: 'Wed', open: '08:00', close: '17:00' },
    { day: 'Thu', open: '08:00', close: '17:00' },
    { day: 'Fri', open: '08:00', close: '17:00' },
    { day: 'Sat', open: null, close: null },
    { day: 'Sun', open: null, close: null },
  ],
  certifications: ['ASE Certified', 'BBB', 'NAPA', 'O’Reilly', 'Synchrony Car Care'],
  reviewStats: { average: 5.0, count: 36 },
} as const;
```

- [ ] **Step 3: Write `src/data/services.ts`**

```ts
import type { Service } from './types';

export const services: Service[] = [
  { id: 'maintenance', category: 'maintenance', name: 'Standard Maintenance',
    summary: 'Scheduled service to keep your vehicle running like new.',
    body: 'Factory-interval inspections, fluid services, filter changes, belt and hose checks. We follow your manufacturer schedule and explain exactly what we found — never a list of upsells.' },
  { id: 'diagnostics', category: 'diagnostics', name: 'Engine Service & Diagnostics',
    summary: 'Check engine light, weird noises, performance issues.',
    body: 'OEM-level diagnostic scanners across most makes. We isolate the cause before we touch a wrench so you’re not paying for guesses.' },
  { id: 'hvac', category: 'hvac', name: 'Heating & A/C',
    summary: 'Cabin comfort year-round — diagnosis, recharge, full system service.',
    body: 'Compressor, evaporator, condenser, and refrigerant work. Leak detection included before any recharge.' },
  { id: 'electrical', category: 'electrical', name: 'Auto Electrical',
    summary: 'Starters, alternators, batteries, wiring, accessories.',
    body: 'From dead batteries to chasing intermittent gremlins. Common on older 4×4s — we’ve seen most of them.' },
  { id: 'exhaust', category: 'exhaust', name: 'Exhaust',
    summary: 'Full exhaust repair, replacement, and custom work.',
    body: 'Welding, custom routing, cat-back installs for trucks and vans. We do clean work that lasts.' },
  { id: 'brakes', category: 'brakes', name: 'Brakes',
    summary: 'Pads, rotors, lines, hardware — pickup-grade or premium.',
    body: 'Inspection is always honest. If you don’t need brakes, we’ll tell you.' },
  { id: 'oil_change', category: 'oil_change', name: 'Oil Changes',
    summary: 'Conventional, synthetic blend, or full synthetic.',
    body: 'Usually same-day. Includes a free top-to-bottom visual inspection.' },
  { id: '4x4_custom', category: '4x4_custom', name: 'Off-Road & 4×4 Customization',
    summary: 'Lift kits, coil springs, control arms, long-travel builds, bumpers, full builds.',
    body: 'This is what makes us different. Chance builds rigs the way he’d build his own — proper alignment, geometry that works, no compromises that bite you on the trail.' },
];
```

- [ ] **Step 4: Write `src/data/recentJobs.ts`**

```ts
import type { RecentJob } from './types';

export const recentJobs: RecentJob[] = [
  { id: 'lexus-gx-long-travel', vehicle: 'Lexus GX', work: 'Long-travel suspension build with Kings shocks', category: '4x4_custom', photoIds: ['lexus-long-travel-01','lexus-long-travel-02','lexus-long-travel-03','lexus-long-travel-04','lexus-kings-shocks'] },
  { id: 'tacoma-3in-lift-camper', vehicle: '2018 Toyota Tacoma', work: '3-inch lift install with camper setup', category: '4x4_custom', photoIds: ['tacoma-lift-camper'] },
  { id: 'tacoma-leveled', vehicle: 'Toyota Tacoma', work: 'Leveling kit install', category: '4x4_custom', photoIds: ['tacoma-leveled-01'] },
  { id: 'tacoma-17-bumper', vehicle: '2017 Toyota Tacoma', work: 'Custom bumper install', category: '4x4_custom', photoIds: ['tacoma-2017-bumper'] },
  { id: 'tacoma-16-shock-rebuild', vehicle: '2016 Toyota Tacoma', work: 'Shock rebuild', category: '4x4_custom', photoIds: ['tacoma-2016-shock-rebuild'] },
  { id: 'bronco-lights', vehicle: 'Ford Bronco', work: 'Off-road light bar install', category: '4x4_custom', photoIds: ['bronco-light-bar'] },
  { id: 'van-exhaust-1', vehicle: 'Service van', work: 'Custom exhaust work', category: 'exhaust', photoIds: ['exhaust-van-01'] },
  { id: 'van-exhaust-2', vehicle: 'Service van', work: 'Exhaust system service', category: 'exhaust', photoIds: ['exhaust-02'] },
  { id: 'van-service-1', vehicle: 'Service van', work: 'General service', category: 'maintenance', photoIds: ['vans-van-01'] },
  { id: 'van-service-2', vehicle: 'Service van', work: 'General service', category: 'maintenance', photoIds: ['vans-van-02'] },
  { id: 'sienna-lift', vehicle: 'Toyota Sienna', work: '3.5-inch lift install', category: '4x4_custom', photoIds: [] },
  { id: 'gladiator-diff', vehicle: 'Jeep Gladiator', work: 'Differential service', category: 'maintenance', photoIds: [] },
  { id: 'transit-injectors', vehicle: 'Ford Transit', work: 'Fuel injector replacement', category: 'diagnostics', photoIds: [] },
  { id: 'sierra-oil', vehicle: 'GMC Sierra', work: 'Oil service', category: 'oil_change', photoIds: [] },
];
```

- [ ] **Step 5: Write `src/data/photos.ts`**

```ts
import type { Photo } from './types';

import lexus01 from '@/assets/photos/lexus-gx/long-travel-01.jpg';
import lexus02 from '@/assets/photos/lexus-gx/long-travel-02.jpg';
import lexus03 from '@/assets/photos/lexus-gx/long-travel-03.jpg';
import lexus04 from '@/assets/photos/lexus-gx/long-travel-04.jpg';
import lexusKings from '@/assets/photos/lexus-gx/kings-shocks.jpg';
import tacoLeveled from '@/assets/photos/tacomas/leveled-01.jpg';
import tacoLiftCamper from '@/assets/photos/tacomas/lift-camper.jpg';
import taco17Bumper from '@/assets/photos/tacomas/2017-bumper.jpg';
import taco16Shock from '@/assets/photos/tacomas/2016-shock-rebuild.jpg';
import broncoLights from '@/assets/photos/broncos/light-bar.jpg';
import vanExhaust01 from '@/assets/photos/exhaust/van-exhaust-01.jpg';
import exhaust02 from '@/assets/photos/exhaust/exhaust-02.jpg';
import van01 from '@/assets/photos/vans/van-01.jpg';
import van02 from '@/assets/photos/vans/van-02.jpg';

type Src = typeof lexus01;
const mk = (id: string, category: Photo['category'], src: Src, alt: string): Photo => ({
  id, category, src: src.src, alt, width: src.width, height: src.height,
});

export const photos: Photo[] = [
  mk('lexus-long-travel-01', 'lexus-gx', lexus01, 'Lexus GX with long-travel suspension build in shop bay'),
  mk('lexus-long-travel-02', 'lexus-gx', lexus02, 'Lexus GX long-travel build — under-vehicle suspension detail'),
  mk('lexus-long-travel-03', 'lexus-gx', lexus03, 'Lexus GX long-travel build — front-end three-quarter view'),
  mk('lexus-long-travel-04', 'lexus-gx', lexus04, 'Lexus GX long-travel build — side profile'),
  mk('lexus-kings-shocks', 'lexus-gx', lexusKings, 'Lexus GX with Kings coilover shocks installed'),
  mk('tacoma-leveled-01', 'tacomas', tacoLeveled, 'Toyota Tacoma after leveling kit installation'),
  mk('tacoma-lift-camper', 'tacomas', tacoLiftCamper, 'Toyota Tacoma with 3-inch lift and camper setup'),
  mk('tacoma-2017-bumper', 'tacomas', taco17Bumper, '2017 Toyota Tacoma with custom front bumper'),
  mk('tacoma-2016-shock-rebuild', 'tacomas', taco16Shock, '2016 Toyota Tacoma after shock rebuild service'),
  mk('bronco-light-bar', 'broncos', broncoLights, 'Ford Bronco with off-road light bar installation'),
  mk('exhaust-van-01', 'exhaust', vanExhaust01, 'Custom exhaust work on service van underside'),
  mk('exhaust-02', 'exhaust', exhaust02, 'Exhaust system work in shop bay'),
  mk('vans-van-01', 'vans', van01, 'Service van in for general maintenance'),
  mk('vans-van-02', 'vans', van02, 'Service van in shop bay'),
];

export const photoById = (id: string) => photos.find(p => p.id === id);
```

- [ ] **Step 6: Write `src/data/builds.ts`**

```ts
import type { Build } from './types';

export const builds: Build[] = [
  { id: 'lexus-gx-long-travel', title: 'Lexus GX Long-Travel', vehicle: 'Lexus GX', summary: 'Full long-travel suspension build with Kings shocks. Built for high-speed desert and rough trail.', category: 'long-travel', photoIds: ['lexus-long-travel-01','lexus-long-travel-02','lexus-long-travel-03','lexus-long-travel-04','lexus-kings-shocks'] },
  { id: 'tacoma-3in-lift-camper', title: 'Tacoma 3" Lift + Camper', vehicle: '2018 Toyota Tacoma', summary: '3-inch lift install paired with a camper setup. Daily driver that doubles as a weekend basecamp.', category: 'lift', photoIds: ['tacoma-lift-camper'] },
  { id: 'tacoma-2017-bumper', title: '2017 Tacoma Custom Bumper', vehicle: '2017 Toyota Tacoma', summary: 'Custom front bumper install — trail-ready, recovery points, winch-mount capable.', category: 'bumper', photoIds: ['tacoma-2017-bumper'] },
  { id: 'bronco-light-bar', title: 'Bronco Off-Road Lights', vehicle: 'Ford Bronco', summary: 'Light bar wiring and mounting for night-trail driving.', category: 'full', photoIds: ['bronco-light-bar'] },
  { id: 'tacoma-shock-rebuild', title: 'Tacoma Shock Rebuild', vehicle: '2016 Toyota Tacoma', summary: 'Full shock rebuild — saved this owner the cost of new units.', category: 'suspension', photoIds: ['tacoma-2016-shock-rebuild'] },
  { id: 'tacoma-leveled', title: 'Tacoma Leveling Kit', vehicle: 'Toyota Tacoma', summary: 'Clean leveling kit install — no rake, room for larger tires.', category: 'lift', photoIds: ['tacoma-leveled-01'] },
];
```

- [ ] **Step 7: Write `src/data/reviews.ts` (sample placeholders, flagged)**

```ts
import type { Review } from './types';

// All sample reviews — flip _isSample to false (or remove) after pasting real verbatim text.
export const reviews: Review[] = [
  { id: 'r1', rating: 5, name: 'Mark T.', date: '2026-03-14', _isSample: true,
    body: 'Chance walked me through every part of the lift he put on my Tacoma. Honest, fair priced, and the work shows it. Won’t take my truck anywhere else.' },
  { id: 'r2', rating: 5, name: 'Sarah P.', date: '2026-02-02', _isSample: true,
    body: 'Brought my van in for a weird noise the dealer couldn’t figure out. Pappytackle had it diagnosed in an afternoon. Old-school service.' },
  { id: 'r3', rating: 5, name: 'James R.', date: '2025-12-18', _isSample: true,
    body: 'Long-travel build on my Lexus GX came out exactly how I pictured it. Quality fab work, communication was great the whole time.' },
  { id: 'r4', rating: 5, name: 'Emily K.', date: '2025-11-04', _isSample: true,
    body: 'Quick oil change, did a full vehicle look-over, told me my brakes had plenty of life left. A shop that doesn’t try to upsell is rare.' },
  { id: 'r5', rating: 5, name: 'David L.', date: '2025-10-22', _isSample: true,
    body: 'Did the diff service on my Gladiator and got me back on the road same week. Friendly local shop, supports the off-road community.' },
  { id: 'r6', rating: 5, name: 'Anna M.', date: '2025-09-30', _isSample: true,
    body: 'My family has been using Pappytackle for everything from oil changes to a full Sienna lift. Chance is the real deal — knowledgeable, kind, fair.' },
];
```

- [ ] **Step 8: Commit**

```bash
git add src/data/
git commit -m "feat: site data — shop, services, jobs, photos, builds, sample reviews"
```

### Task 6: AI client + schemas + shop context

**Files:**
- Create: `src/lib/ai/client.ts`, `schemas.ts`, `shopContext.ts`
- Create: `tests/lib/ai/schemas.test.ts`

- [ ] **Step 1: Write `src/lib/ai/schemas.ts`**

```ts
import { z } from 'zod';

export const ServiceCategoryZ = z.enum([
  'maintenance', 'diagnostics', 'hvac', 'electrical',
  'exhaust', 'brakes', 'oil_change', '4x4_custom',
]);

export const DiagnoseResultZ = z.object({
  severity: z.enum(['informational', 'schedule_visit', 'have_it_looked_at']),
  likely_causes: z.array(z.object({
    label: z.string().min(2),
    plain_explanation: z.string().min(10),
  })).min(1).max(4),
  safe_to_drive: z.union([z.boolean(), z.literal('unsure')]),
  suggested_service_category: ServiceCategoryZ.nullable(),
  next_step: z.string().min(10),
  disclaimer: z.string().min(10),
});
export type DiagnoseResult = z.infer<typeof DiagnoseResultZ>;

export const SuggestServiceResultZ = z.object({
  service_category: ServiceCategoryZ,
  rationale: z.string().min(5),
  confidence: z.enum(['high', 'medium', 'low']),
});
export type SuggestServiceResult = z.infer<typeof SuggestServiceResultZ>;

export const SearchResultItemZ = z.object({
  kind: z.enum(['service', 'recent_job']),
  id: z.string().min(1),
  title: z.string().min(1),
  score: z.number().min(0).max(1),
  reason: z.string().min(3),
  matchedTerms: z.array(z.string()),
});
export const SearchResultZ = z.object({
  results: z.array(SearchResultItemZ),
});
export type SearchResult = z.infer<typeof SearchResultItemZ>;

export const DiagnoseInputZ = z.object({
  symptom: z.string().min(3).max(2000),
  vehicle: z.string().max(200).optional(),
});
export const SuggestInputZ = z.object({
  description: z.string().min(3).max(2000),
});
export const SearchInputZ = z.object({
  query: z.string().min(2).max(200),
});
export const ChatInputZ = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(4000),
  })).min(1).max(40),
});
```

- [ ] **Step 2: Write `tests/lib/ai/schemas.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { DiagnoseResultZ, SearchResultZ } from '@/lib/ai/schemas';

describe('DiagnoseResultZ', () => {
  it('rejects empty causes', () => {
    expect(() => DiagnoseResultZ.parse({
      severity: 'informational',
      likely_causes: [],
      safe_to_drive: true,
      suggested_service_category: null,
      next_step: 'stop by if it gets worse',
      disclaimer: 'always defer to in-shop inspection',
    })).toThrow();
  });
  it('accepts a well-formed result', () => {
    const ok = DiagnoseResultZ.parse({
      severity: 'schedule_visit',
      likely_causes: [{ label: 'Worn brake pads', plain_explanation: 'Most likely the pads are at the end of their life.' }],
      safe_to_drive: 'unsure',
      suggested_service_category: 'brakes',
      next_step: 'have Chance take a look this week',
      disclaimer: 'this is a best guess from limited info',
    });
    expect(ok.severity).toBe('schedule_visit');
  });
});

describe('SearchResultZ', () => {
  it('parses results array', () => {
    const ok = SearchResultZ.parse({ results: [
      { kind: 'service', id: 'brakes', title: 'Brakes', score: 0.9, reason: 'direct match', matchedTerms: ['brake'] },
    ] });
    expect(ok.results).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Add vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { environment: 'happy-dom', globals: false },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

- [ ] **Step 4: Run schema tests**

```bash
npm test -- tests/lib/ai/schemas.test.ts
```
Expected: 3 tests pass.

- [ ] **Step 5: Write `src/lib/ai/client.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk';

export const MODELS = {
  fast: 'claude-haiku-4-5',
  chat: 'claude-sonnet-4-6',
} as const;

const apiKey = import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn('[ai/client] ANTHROPIC_API_KEY not set — AI features will fail at request time.');
}
export const anthropic = new Anthropic({ apiKey: apiKey ?? 'missing' });

export async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err: any) {
      lastErr = err;
      const status = err?.status ?? err?.response?.status;
      const retriable = status === 429 || (status >= 500 && status < 600);
      if (!retriable || i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}
```

- [ ] **Step 6: Write `src/lib/ai/shopContext.ts`**

```ts
import { shop } from '@/data/shop';
import { services } from '@/data/services';
import { recentJobs } from '@/data/recentJobs';

const hoursLine = shop.hours
  .map(h => h.open ? `${h.day} ${h.open}-${h.close}` : `${h.day} closed`).join(', ');

export const SHOP_SYSTEM = `You are the in-house assistant for ${shop.name}, an honest auto repair and off-road customization shop in ${shop.address.city}, ${shop.address.state}.

OWNER: ${shop.owner}. Decade-plus of experience. ASE Certified.
LOCATION: ${shop.address.line1}, ${shop.address.city}, ${shop.address.state} ${shop.address.zip}.
PHONE: (${shop.phone.slice(0,3)}) ${shop.phone.slice(3,6)}-${shop.phone.slice(6)}.
HOURS: ${hoursLine}.
REPUTATION: ${shop.reviewStats.average} stars across ${shop.reviewStats.count}+ verified reviews. Affiliations: ${shop.certifications.join(', ')}.

WHAT WE DO:
${services.map(s => `- ${s.name}: ${s.summary}`).join('\n')}

RECENT REAL JOBS (use as proof; cite vehicle + work when relevant):
${recentJobs.map(j => `- ${j.vehicle} — ${j.work}`).join('\n')}

VOICE & RULES (strict):
- Warm, plainspoken, never alarmist.
- Never use the words: emergency, dangerous, critical, urgent.
- Never give a definitive diagnosis. Always frame as "likely cause" and defer to in-shop inspection.
- If asked about pricing, say honest ranges only when broadly safe to do so, and always note that real quote requires the vehicle in the bay.
- If asked about a service we don't list, suggest calling the shop directly.
- If the question is off-topic (not auto-related), politely redirect to what we can help with.
- We DO work on most makes including Toyota, Ford, Jeep, GMC, Lexus, Chevy, Dodge/Ram, Nissan, and most domestic and Japanese vehicles. For European or specialty vehicles, recommend calling to confirm.
- Always be ready to suggest "schedule a visit" via the booking page or a call to ${shop.phone}.`;
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/ai/ tests/ vitest.config.ts
git commit -m "feat(ai): zod schemas, anthropic client with retry, shop context"
```

### Task 7: AI feature — diagnose

**Files:**
- Create: `src/lib/ai/features/diagnose.ts`
- Create: `src/pages/api/ai/diagnose.ts`
- Create: `tests/lib/ai/diagnose.test.ts`

- [ ] **Step 1: Write `src/lib/ai/features/diagnose.ts`**

```ts
import { anthropic, MODELS, withRetry } from '../client';
import { SHOP_SYSTEM } from '../shopContext';
import { DiagnoseInputZ, DiagnoseResultZ, type DiagnoseResult } from '../schemas';

const TOOL = {
  name: 'return_diagnosis',
  description: 'Return a structured diagnosis. Always non-alarmist, always defers to in-shop inspection.',
  input_schema: {
    type: 'object',
    properties: {
      severity: { type: 'string', enum: ['informational', 'schedule_visit', 'have_it_looked_at'] },
      likely_causes: {
        type: 'array', minItems: 1, maxItems: 4,
        items: {
          type: 'object',
          properties: { label: { type: 'string' }, plain_explanation: { type: 'string' } },
          required: ['label', 'plain_explanation'],
        },
      },
      safe_to_drive: { oneOf: [{ type: 'boolean' }, { type: 'string', enum: ['unsure'] }] },
      suggested_service_category: { type: ['string', 'null'], enum: ['maintenance','diagnostics','hvac','electrical','exhaust','brakes','oil_change','4x4_custom', null] },
      next_step: { type: 'string' },
      disclaimer: { type: 'string' },
    },
    required: ['severity', 'likely_causes', 'safe_to_drive', 'suggested_service_category', 'next_step', 'disclaimer'],
  },
} as const;

export async function diagnose(input: unknown): Promise<DiagnoseResult> {
  const { symptom, vehicle } = DiagnoseInputZ.parse(input);
  const userMessage = vehicle
    ? `Vehicle: ${vehicle}\nSymptom: ${symptom}`
    : `Symptom: ${symptom}`;

  const resp = await withRetry(() => anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 800,
    tools: [TOOL as any],
    tool_choice: { type: 'tool', name: 'return_diagnosis' },
    system: [{ type: 'text', text: SHOP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  }));

  const block = resp.content.find((b: any) => b.type === 'tool_use') as any;
  if (!block) throw new Error('No tool_use block in diagnose response');
  return DiagnoseResultZ.parse(block.input);
}
```

- [ ] **Step 2: Write `src/pages/api/ai/diagnose.ts`**

```ts
import type { APIRoute } from 'astro';
import { diagnose } from '@/lib/ai/features/diagnose';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const result = await diagnose(body);
    return new Response(JSON.stringify(result), {
      status: 200, headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[api/ai/diagnose]', err?.message ?? err);
    return new Response(JSON.stringify({
      error: 'Couldn\'t reach our assistant — give us a call at (360) 543-6990 and we\'ll help directly.',
    }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
};
```

- [ ] **Step 3: Write `tests/lib/ai/diagnose.test.ts` (mocked SDK)**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'tool_use', name: 'return_diagnosis', input: {
            severity: 'schedule_visit',
            likely_causes: [{ label: 'Brake pads worn', plain_explanation: 'Common cause of squealing when braking.' }],
            safe_to_drive: 'unsure',
            suggested_service_category: 'brakes',
            next_step: 'have Chance take a look this week',
            disclaimer: 'best guess from limited info — defer to in-shop inspection',
          } }],
        }),
      },
    })),
  };
});

const { diagnose } = await import('@/lib/ai/features/diagnose');

beforeEach(() => vi.clearAllMocks());

describe('diagnose', () => {
  it('returns a validated DiagnoseResult', async () => {
    const r = await diagnose({ symptom: 'squealing noise when I brake', vehicle: '2017 Tacoma' });
    expect(r.severity).toBe('schedule_visit');
    expect(r.suggested_service_category).toBe('brakes');
  });
  it('rejects too-short input', async () => {
    await expect(diagnose({ symptom: 'x' })).rejects.toThrow();
  });
});
```

- [ ] **Step 4: Run**

```bash
npm test -- tests/lib/ai/diagnose.test.ts
```
Expected: 2 pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ai/features/diagnose.ts src/pages/api/ai/diagnose.ts tests/lib/ai/diagnose.test.ts
git commit -m "feat(ai): diagnose feature + endpoint + tests"
```

### Task 8: AI feature — suggestService

**Files:**
- Create: `src/lib/ai/features/suggestService.ts`
- Create: `src/pages/api/ai/suggest-service.ts`
- Create: `tests/lib/ai/suggestService.test.ts`

- [ ] **Step 1: Write `src/lib/ai/features/suggestService.ts`**

```ts
import { anthropic, MODELS, withRetry } from '../client';
import { SHOP_SYSTEM } from '../shopContext';
import { SuggestInputZ, SuggestServiceResultZ, type SuggestServiceResult } from '../schemas';

const TOOL = {
  name: 'return_suggestion',
  description: 'Map a customer description to a service category we offer.',
  input_schema: {
    type: 'object',
    properties: {
      service_category: { type: 'string', enum: ['maintenance','diagnostics','hvac','electrical','exhaust','brakes','oil_change','4x4_custom'] },
      rationale: { type: 'string' },
      confidence: { type: 'string', enum: ['high','medium','low'] },
    },
    required: ['service_category', 'rationale', 'confidence'],
  },
} as const;

export async function suggestService(input: unknown): Promise<SuggestServiceResult> {
  const { description } = SuggestInputZ.parse(input);
  const resp = await withRetry(() => anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 300,
    tools: [TOOL as any],
    tool_choice: { type: 'tool', name: 'return_suggestion' },
    system: [{ type: 'text', text: SHOP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Customer description:\n${description}` }],
  }));
  const block = resp.content.find((b: any) => b.type === 'tool_use') as any;
  if (!block) throw new Error('No tool_use block');
  return SuggestServiceResultZ.parse(block.input);
}
```

- [ ] **Step 2: Write `src/pages/api/ai/suggest-service.ts`**

```ts
import type { APIRoute } from 'astro';
import { suggestService } from '@/lib/ai/features/suggestService';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const r = await suggestService(await request.json());
    return new Response(JSON.stringify(r), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    console.error('[api/ai/suggest-service]', err?.message ?? err);
    return new Response(JSON.stringify({ error: 'Couldn\'t process that — try again or call (360) 543-6990.' }),
      { status: 502, headers: { 'content-type': 'application/json' } });
  }
};
```

- [ ] **Step 3: Write `tests/lib/ai/suggestService.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn().mockResolvedValue({ content: [{ type: 'tool_use', name: 'return_suggestion', input: {
      service_category: '4x4_custom', rationale: 'lift install', confidence: 'high',
    } }] }) },
  })),
}));

const { suggestService } = await import('@/lib/ai/features/suggestService');

beforeEach(() => vi.clearAllMocks());

describe('suggestService', () => {
  it('maps description to a category', async () => {
    const r = await suggestService({ description: 'I want a 3 inch lift on my Tacoma' });
    expect(r.service_category).toBe('4x4_custom');
    expect(r.confidence).toBe('high');
  });
});
```

- [ ] **Step 4: Run + commit**

```bash
npm test -- tests/lib/ai/suggestService.test.ts
git add src/lib/ai/features/suggestService.ts src/pages/api/ai/suggest-service.ts tests/lib/ai/suggestService.test.ts
git commit -m "feat(ai): suggestService feature + endpoint + tests"
```

### Task 9: AI feature — search

**Files:**
- Create: `src/lib/ai/features/search.ts`
- Create: `src/pages/api/ai/search.ts`
- Create: `tests/lib/ai/search.test.ts`

- [ ] **Step 1: Write `src/lib/ai/features/search.ts`**

```ts
import { anthropic, MODELS, withRetry } from '../client';
import { SHOP_SYSTEM } from '../shopContext';
import { SearchInputZ, SearchResultZ } from '../schemas';
import { services } from '@/data/services';
import { recentJobs } from '@/data/recentJobs';

const TOOL = {
  name: 'return_search_results',
  description: 'Return ranked search results across shop services and recent jobs.',
  input_schema: {
    type: 'object',
    properties: {
      results: {
        type: 'array', maxItems: 8,
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['service', 'recent_job'] },
            id: { type: 'string' },
            title: { type: 'string' },
            score: { type: 'number', minimum: 0, maximum: 1 },
            reason: { type: 'string' },
            matchedTerms: { type: 'array', items: { type: 'string' } },
          },
          required: ['kind','id','title','score','reason','matchedTerms'],
        },
      },
    },
    required: ['results'],
  },
} as const;

export async function search(input: unknown) {
  const { query } = SearchInputZ.parse(input);
  const catalog = JSON.stringify({
    services: services.map(s => ({ id: s.id, title: s.name, summary: s.summary })),
    recent_jobs: recentJobs.map(j => ({ id: j.id, title: `${j.vehicle} — ${j.work}` })),
  });
  const resp = await withRetry(() => anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 800,
    tools: [TOOL as any],
    tool_choice: { type: 'tool', name: 'return_search_results' },
    system: [{ type: 'text', text: SHOP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: `Query: ${query}\n\nRank entries from this catalog by relevance. Only include entries that genuinely match; empty array is fine.\n\nCatalog:\n${catalog}`,
    }],
  }));
  const block = resp.content.find((b: any) => b.type === 'tool_use') as any;
  if (!block) throw new Error('No tool_use block');
  return SearchResultZ.parse(block.input);
}
```

- [ ] **Step 2: Write `src/pages/api/ai/search.ts`**

```ts
import type { APIRoute } from 'astro';
import { search } from '@/lib/ai/features/search';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const r = await search(await request.json());
    return new Response(JSON.stringify(r), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    console.error('[api/ai/search]', err?.message ?? err);
    return new Response(JSON.stringify({ error: 'Search is unavailable right now.' }),
      { status: 502, headers: { 'content-type': 'application/json' } });
  }
};
```

- [ ] **Step 3: Write `tests/lib/ai/search.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn().mockResolvedValue({ content: [{ type: 'tool_use', name: 'return_search_results', input: {
      results: [{ kind: 'service', id: 'brakes', title: 'Brakes', score: 0.95, reason: 'direct match', matchedTerms: ['brake'] }],
    } }] }) },
  })),
}));

const { search } = await import('@/lib/ai/features/search');

beforeEach(() => vi.clearAllMocks());

describe('search', () => {
  it('returns ranked results', async () => {
    const r = await search({ query: 'brake' });
    expect(r.results[0].id).toBe('brakes');
  });
});
```

- [ ] **Step 4: Run + commit**

```bash
npm test -- tests/lib/ai/search.test.ts
git add src/lib/ai/features/search.ts src/pages/api/ai/search.ts tests/lib/ai/search.test.ts
git commit -m "feat(ai): search feature + endpoint + tests"
```

### Task 10: AI feature — streaming chat

**Files:**
- Create: `src/lib/ai/features/assistantReply.ts`
- Create: `src/pages/api/ai/chat.ts`

- [ ] **Step 1: Write `src/lib/ai/features/assistantReply.ts`**

```ts
import { anthropic, MODELS, withRetry } from '../client';
import { SHOP_SYSTEM } from '../shopContext';
import { ChatInputZ } from '../schemas';

export async function* streamReply(input: unknown): AsyncIterable<string> {
  const { messages } = ChatInputZ.parse(input);
  const stream = await withRetry(() => anthropic.messages.stream({
    model: MODELS.chat,
    max_tokens: 1024,
    system: [{ type: 'text', text: SHOP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  }));
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
```

- [ ] **Step 2: Write `src/pages/api/ai/chat.ts`**

```ts
import type { APIRoute } from 'astro';
import { streamReply } from '@/lib/ai/features/assistantReply';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try { body = await request.json(); } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of streamReply(body)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err: any) {
        console.error('[api/ai/chat]', err?.message ?? err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Assistant unavailable. Call (360) 543-6990.' })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      'connection': 'keep-alive',
    },
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/features/assistantReply.ts src/pages/api/ai/chat.ts
git commit -m "feat(ai): streaming chat (SSE) endpoint"
```

---

## Phase 2 — Pages & Interactive Islands

### Task 11: Reusable UI primitives

**Files:**
- Create: `src/components/Button.astro`, `BadgeDiamond.astro`, `SectionDark.astro`, `SectionLight.astro`, `Eyebrow.astro`, `TodoBlock.astro`, `CertStrip.astro`, `StarRating.astro`

- [ ] **Step 1: Write `Button.astro`**

```astro
---
interface Props {
  href?: string;
  variant?: 'ember' | 'ghost-on-dark' | 'ghost-on-light' | 'gold-link';
  size?: 'md' | 'lg';
  class?: string;
}
const { href, variant = 'ember', size = 'md', class: cls = '' } = Astro.props;
const sizes = { md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3.5 text-base' };
const variants = {
  ember: 'bg-[var(--color-ember)] text-[var(--color-paper)] hover:bg-[var(--color-ember-dark)]',
  'ghost-on-dark': 'border border-[var(--color-bone)]/40 text-[var(--color-paper)] hover:bg-[var(--color-bone)]/10',
  'ghost-on-light': 'border border-[var(--color-ink)]/30 text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5',
  'gold-link': 'text-[var(--color-gold)] underline-offset-4 hover:underline',
};
const base = 'inline-flex items-center gap-2 font-display font-bold uppercase tracking-wide rounded-[var(--radius-button)] transition-colors';
const Tag = href ? 'a' : 'button';
---
<Tag href={href} class={`${base} ${sizes[size]} ${variants[variant]} ${cls}`}><slot /></Tag>
```

- [ ] **Step 2: Write `BadgeDiamond.astro`**

```astro
---
interface Props { color?: 'navy' | 'ember' | 'gold' | 'bone'; class?: string; }
const { color = 'navy', class: cls = '' } = Astro.props;
const bg = { navy: 'var(--color-ink)', ember: 'var(--color-ember)', gold: 'var(--color-gold)', bone: 'var(--color-bone)' }[color];
const fg = color === 'gold' || color === 'bone' ? 'var(--color-ink)' : 'var(--color-paper)';
---
<span class={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-display font-bold uppercase tracking-wider ${cls}`} style={`background:${bg};color:${fg};clip-path:polygon(8% 0,92% 0,100% 50%,92% 100%,8% 100%,0 50%);`}>
  <slot />
</span>
```

- [ ] **Step 3: Write `SectionDark.astro` and `SectionLight.astro`**

```astro
---
// SectionDark.astro
interface Props { class?: string; }
const { class: cls = '' } = Astro.props;
---
<section class={`bg-[var(--color-ink)] text-[var(--color-paper)] py-20 md:py-28 ${cls}`}><div class="container-default"><slot /></div></section>
```

```astro
---
// SectionLight.astro
interface Props { class?: string; tone?: 'paper' | 'bone'; }
const { class: cls = '', tone = 'paper' } = Astro.props;
const bg = tone === 'paper' ? 'var(--color-paper)' : 'var(--color-bone)';
---
<section class={`text-[var(--color-ink)] py-20 md:py-28 ${cls}`} style={`background:${bg}`}><div class="container-default"><slot /></div></section>
```

- [ ] **Step 4: Write `Eyebrow.astro`, `TodoBlock.astro`, `CertStrip.astro`, `StarRating.astro`**

`Eyebrow.astro`:
```astro
---
interface Props { class?: string; }
const { class: cls = '' } = Astro.props;
---
<span class={`eyebrow ${cls}`}><slot /></span>
```

`TodoBlock.astro`:
```astro
---
import BadgeDiamond from './BadgeDiamond.astro';
interface Props { label: string; ratio?: string; }
const { label, ratio = '16/10' } = Astro.props;
---
<div class="relative w-full bg-[var(--color-ink-2)] border border-[var(--color-bone)]/15 rounded-[var(--radius-card)] grid place-items-center text-[var(--color-bone)]/60" style={`aspect-ratio: ${ratio}`}>
  <div class="flex flex-col items-center gap-3">
    <BadgeDiamond color="gold">TODO</BadgeDiamond>
    <p class="text-sm">{label}</p>
  </div>
</div>
```

`CertStrip.astro`:
```astro
---
import { shop } from '@/data/shop';
---
<div class="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-6 text-[var(--color-bone)]/70 text-xs uppercase tracking-[0.2em] font-bold">
  {shop.certifications.map(c => <span class="font-display">{c}</span>)}
</div>
```

`StarRating.astro`:
```astro
---
interface Props { rating: 1|2|3|4|5; }
const { rating } = Astro.props;
---
<div class="inline-flex" role="img" aria-label={`${rating} out of 5 stars`}>
  {Array.from({length: 5}, (_, i) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={i < rating ? 'var(--color-gold)' : 'none'} stroke="var(--color-gold)" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  ))}
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: ui primitives (button, badge, sections, eyebrow, todo, certs, stars)"
```

### Task 12: Home page

**Files:**
- Modify: `src/pages/index.astro` (full replacement)
- Create: `src/components/home/Hero.astro`, `TwoPathSplit.astro`, `ServiceGrid.astro`, `RecentBuilds.astro`, `ReviewsBand.astro`, `BookingCtaBand.astro`

This is the largest UI task. Treat as one cohesive deliverable.

- [ ] **Step 1: Write `src/components/home/Hero.astro`**

```astro
---
import { Image } from 'astro:assets';
import hero from '@/assets/photos/lexus-gx/long-travel-01.jpg';
import Button from '@/components/Button.astro';
import CallButton from '@/components/CallButton.astro';
import Eyebrow from '@/components/Eyebrow.astro';

const hasVideo = true; // import.meta.glob check below
const videoSrc = '/videos/lexus-gx-hero.mp4';
const videoWebm = '/videos/lexus-gx-hero.webm';
---
<section class="relative min-h-[100svh] flex items-end overflow-hidden bg-[var(--color-char)]">
  <Image src={hero} alt="Lexus GX long-travel build" class="absolute inset-0 w-full h-full object-cover opacity-90" widths={[960,1280,1920,2560]} sizes="100vw" loading="eager" fetchpriority="high" />
  {hasVideo && (
    <video class="absolute inset-0 w-full h-full object-cover opacity-90" autoplay muted loop playsinline poster={hero.src}>
      <source src={videoWebm} type="video/webm" />
      <source src={videoSrc} type="video/mp4" />
    </video>
  )}
  <div class="absolute inset-0 bg-gradient-to-t from-[var(--color-char)] via-[var(--color-char)]/60 to-transparent"></div>
  <div class="absolute inset-0 bg-gradient-to-r from-[var(--color-char)]/80 via-transparent to-transparent"></div>
  <div class="relative container-wide pb-20 md:pb-28">
    <Eyebrow class="mb-4 text-[var(--color-gold)]">Bellingham, WA · Est. 2024</Eyebrow>
    <h1 class="text-6xl md:text-7xl lg:text-8xl text-[var(--color-paper)] max-w-4xl">
      Built to <span class="text-[var(--color-ember)]">go anywhere.</span>
    </h1>
    <p class="mt-6 max-w-xl text-lg text-[var(--color-bone)] leading-relaxed">
      Honest auto repair and full custom 4×4 builds — under one roof, by one shop, with the same name on the door every time you visit.
    </p>
    <div class="mt-8 flex flex-wrap gap-3">
      <Button href="/book" variant="ember" size="lg">Book Appointment</Button>
      <CallButton variant="ghost" />
    </div>
  </div>
</section>
```

- [ ] **Step 2: Write `src/components/home/TwoPathSplit.astro`**

```astro
---
import Button from '@/components/Button.astro';
import Eyebrow from '@/components/Eyebrow.astro';
---
<section class="bg-[var(--color-paper)]">
  <div class="grid md:grid-cols-2">
    <div class="bg-[var(--color-bone)] p-12 md:p-20 flex flex-col justify-center">
      <Eyebrow class="!text-[var(--color-ember)]">Honest Auto Repair</Eyebrow>
      <h2 class="mt-4 text-4xl md:text-5xl">Everyday Maintenance & Repair</h2>
      <p class="mt-4 text-lg leading-relaxed text-[var(--color-ink)]/85 max-w-md">
        Oil, brakes, A/C, electrical, diagnostics. The work your car needs, explained clearly, priced fairly.
      </p>
      <div class="mt-6"><Button href="/services" variant="ghost-on-light">See services</Button></div>
    </div>
    <div class="bg-[var(--color-ink)] text-[var(--color-paper)] p-12 md:p-20 flex flex-col justify-center">
      <Eyebrow>4×4 Customization</Eyebrow>
      <h2 class="mt-4 text-4xl md:text-5xl">Lift Kits, Long-Travel, Full Builds</h2>
      <p class="mt-4 text-lg leading-relaxed text-[var(--color-bone)] max-w-md">
        From a clean leveling kit to a Kings long-travel build — Chance builds rigs the way he’d build his own.
      </p>
      <div class="mt-6"><Button href="/builds" variant="ghost-on-dark">See builds</Button></div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Write `src/components/home/ServiceGrid.astro`**

```astro
---
import { services } from '@/data/services';
import Eyebrow from '@/components/Eyebrow.astro';

const icons: Record<string, string> = {
  maintenance: '🔧', diagnostics: '🔍', hvac: '❄️', electrical: '⚡',
  exhaust: '🚿', brakes: '🛞', oil_change: '🛢️', '4x4_custom': '🏔️',
};
const featured = services.filter(s => s.category !== '4x4_custom').slice(0, 6);
---
<section class="bg-[var(--color-paper)] py-20 md:py-28">
  <div class="container-default">
    <div class="text-center mb-12">
      <Eyebrow class="!text-[var(--color-ember)]">What we work on</Eyebrow>
      <h2 class="mt-2 text-4xl md:text-5xl">Full-service auto shop.</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      {featured.map(s => (
        <a href={`/services#${s.id}`} class="block p-6 bg-white border border-[var(--color-ink)]/10 rounded-[var(--radius-card)] hover:border-[var(--color-ember)] transition-colors group">
          <div class="text-2xl mb-3" aria-hidden="true">{icons[s.id] ?? '🔧'}</div>
          <h3 class="text-xl group-hover:text-[var(--color-ember)] transition-colors">{s.name}</h3>
          <p class="mt-2 text-sm text-[var(--color-ink)]/75 leading-relaxed">{s.summary}</p>
        </a>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 4: Write `src/components/home/RecentBuilds.astro`**

```astro
---
import { Image } from 'astro:assets';
import { builds } from '@/data/builds';
import { photoById } from '@/data/photos';
import Eyebrow from '@/components/Eyebrow.astro';
import Button from '@/components/Button.astro';

import lexus from '@/assets/photos/lexus-gx/long-travel-03.jpg';
import taco from '@/assets/photos/tacomas/lift-camper.jpg';
import bronco from '@/assets/photos/broncos/light-bar.jpg';

const featured = [
  { src: lexus, build: builds.find(b => b.id === 'lexus-gx-long-travel')! },
  { src: taco, build: builds.find(b => b.id === 'tacoma-3in-lift-camper')! },
  { src: bronco, build: builds.find(b => b.id === 'bronco-light-bar')! },
];
---
<section class="bg-[var(--color-char)] text-[var(--color-paper)] py-20 md:py-28">
  <div class="container-default">
    <div class="flex items-end justify-between mb-12">
      <div>
        <Eyebrow>Recent Builds</Eyebrow>
        <h2 class="mt-2 text-4xl md:text-5xl">Real rigs. Real work.</h2>
      </div>
      <Button href="/builds" variant="gold-link">See all builds →</Button>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      {featured.map(({ src, build }) => (
        <a href={`/builds#${build.id}`} class="group block">
          <div class="aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-ink-2)]">
            <Image src={src} alt={build.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" widths={[400,600,800]} sizes="(min-width:768px) 33vw, 100vw" />
          </div>
          <h3 class="mt-4 text-2xl group-hover:text-[var(--color-gold)] transition-colors">{build.title}</h3>
          <p class="mt-1 text-sm text-[var(--color-bone)]/85">{build.vehicle} · {build.summary}</p>
        </a>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 5: Write `src/components/home/ReviewsBand.astro`**

```astro
---
import { reviews } from '@/data/reviews';
import StarRating from '@/components/StarRating.astro';
import Eyebrow from '@/components/Eyebrow.astro';
import Button from '@/components/Button.astro';
import { shop } from '@/data/shop';

const featured = reviews.slice(0, 3);
---
<section class="bg-[var(--color-ink)] text-[var(--color-paper)] py-20 md:py-28">
  <div class="container-default">
    <div class="text-center mb-12">
      <Eyebrow>What customers say</Eyebrow>
      <h2 class="mt-2 text-4xl md:text-5xl">{shop.reviewStats.average} stars · {shop.reviewStats.count}+ reviews</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      {featured.map(r => (
        <figure class="p-6 bg-[var(--color-ink-2)] border border-[var(--color-bone)]/10 rounded-[var(--radius-card)]">
          <StarRating rating={r.rating} />
          <blockquote class="mt-4 text-[var(--color-bone)] leading-relaxed">“{r.body}”</blockquote>
          <figcaption class="mt-4 text-sm text-[var(--color-bone)]/60">— {r.name}</figcaption>
        </figure>
      ))}
    </div>
    <div class="mt-10 text-center"><Button href="/reviews" variant="ghost-on-dark">Read all reviews</Button></div>
  </div>
</section>
```

- [ ] **Step 6: Write `src/components/home/BookingCtaBand.astro`**

```astro
---
import Button from '@/components/Button.astro';
import CallButton from '@/components/CallButton.astro';
---
<section class="bg-[var(--color-ember)] text-[var(--color-paper)] py-16">
  <div class="container-default flex flex-col md:flex-row md:items-center md:justify-between gap-6">
    <div>
      <h2 class="text-3xl md:text-4xl">Ready when you are.</h2>
      <p class="mt-2 text-[var(--color-paper)]/90">Book online or give us a call — we’ll find a slot that works.</p>
    </div>
    <div class="flex flex-wrap gap-3">
      <Button href="/book" variant="ghost-on-dark" size="lg" class="!bg-[var(--color-paper)] !text-[var(--color-ember)] !border-transparent hover:!bg-[var(--color-bone)]">Book appointment</Button>
      <CallButton variant="ghost" />
    </div>
  </div>
</section>
```

- [ ] **Step 7: Replace `src/pages/index.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import Hero from '@/components/home/Hero.astro';
import TwoPathSplit from '@/components/home/TwoPathSplit.astro';
import ServiceGrid from '@/components/home/ServiceGrid.astro';
import RecentBuilds from '@/components/home/RecentBuilds.astro';
import ReviewsBand from '@/components/home/ReviewsBand.astro';
import BookingCtaBand from '@/components/home/BookingCtaBand.astro';
import CertStrip from '@/components/CertStrip.astro';
---
<BaseLayout title="Honest auto repair & custom 4×4 builds" navOver>
  <Hero />
  <div class="bg-[var(--color-char)]"><CertStrip /></div>
  <TwoPathSplit />
  <ServiceGrid />
  <RecentBuilds />
  <ReviewsBand />
  <BookingCtaBand />
</BaseLayout>
```

- [ ] **Step 8: Run dev, view in browser, check golden path manually**

```bash
npm run dev -- --port 4321 &
sleep 4
echo "Open http://localhost:4321 in browser — verify hero photo loads, nav goes transparent→solid on scroll, all sections render, mobile menu works."
# Leave server running for review
```

Acceptance:
- Hero photo/video visible; H1 readable against scrim.
- Cert strip renders without overflow on mobile.
- Two-path split: half bone, half ink.
- Service grid: 6 cards, 2-col mobile / 3-col desktop.
- Recent builds: 3 large photos with hover scale.
- Reviews band: 3 cards with stars.
- CTA band: ember background.
- Footer fully rendered.
- No console errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(home): cinematic hero, two-path split, services, recent builds, reviews, CTA"
```

### Task 13: 4×4 Builds gallery page

**Files:**
- Create: `src/pages/builds.astro`
- Create: `src/components/builds/BuildGallery.tsx` (React island, for filter state)
- Create: `src/components/builds/Lightbox.tsx`

- [ ] **Step 1: Write `src/components/builds/Lightbox.tsx`**

```tsx
import { useEffect } from 'react';

interface Props {
  open: boolean;
  src: string;
  alt: string;
  title: string;
  caption: string;
  onClose: () => void;
}

export default function Lightbox({ open, src, alt, title, caption, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 bg-black/90 grid place-items-center p-6" onClick={onClose}>
      <button aria-label="Close" onClick={onClose} className="absolute top-4 right-4 text-white p-2">✕</button>
      <figure className="max-w-6xl max-h-full" onClick={e => e.stopPropagation()}>
        <img src={src} alt={alt} className="max-h-[80vh] w-auto mx-auto rounded" />
        <figcaption className="mt-4 text-white text-center">
          <div className="font-display font-bold uppercase text-xl">{title}</div>
          <div className="text-sm text-white/80 mt-1">{caption}</div>
        </figcaption>
      </figure>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/builds/BuildGallery.tsx`**

```tsx
import { useMemo, useState } from 'react';
import Lightbox from './Lightbox';

type Cat = 'all' | 'lift' | 'suspension' | 'long-travel' | 'bumper' | 'full';
const CATS: { id: Cat; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'lift', label: 'Lift Kits' },
  { id: 'suspension', label: 'Suspension' },
  { id: 'long-travel', label: 'Long-Travel' },
  { id: 'bumper', label: 'Bumpers' },
  { id: 'full', label: 'Full Builds' },
];

interface Item { id: string; title: string; vehicle: string; summary: string; category: Exclude<Cat,'all'>; photoSrc: string; photoAlt: string; }

export default function BuildGallery({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<Cat>('all');
  const [open, setOpen] = useState<Item | null>(null);
  const filtered = useMemo(() => filter === 'all' ? items : items.filter(i => i.category === filter), [filter, items]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter builds">
        {CATS.map(c => (
          <button key={c.id} role="tab" aria-selected={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={`px-4 py-2 font-display font-bold uppercase text-sm rounded transition-colors ${filter === c.id ? 'bg-[var(--color-ember)] text-[var(--color-paper)]' : 'border border-[var(--color-ink)]/25 text-[var(--color-ink)] hover:border-[var(--color-ember)]'}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(i => (
          <button key={i.id} onClick={() => setOpen(i)} className="group block text-left">
            <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-ink-2)]">
              <img src={i.photoSrc} alt={i.photoAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            </div>
            <h3 className="mt-3 text-lg font-display font-bold uppercase tracking-wide">{i.title}</h3>
            <p className="text-sm text-[var(--color-ink)]/75">{i.vehicle}</p>
          </button>
        ))}
      </div>
      <Lightbox open={!!open} src={open?.photoSrc ?? ''} alt={open?.photoAlt ?? ''} title={open?.title ?? ''} caption={`${open?.vehicle ?? ''} — ${open?.summary ?? ''}`} onClose={() => setOpen(null)} />
    </div>
  );
}
```

- [ ] **Step 3: Write `src/pages/builds.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import SectionLight from '@/components/SectionLight.astro';
import Eyebrow from '@/components/Eyebrow.astro';
import { builds } from '@/data/builds';
import { photoById } from '@/data/photos';
import BuildGallery from '@/components/builds/BuildGallery';
import TodoBlock from '@/components/TodoBlock.astro';

const items = builds.flatMap(b => {
  if (b.photoIds.length === 0) return [];
  return b.photoIds.map((pid, idx) => {
    const p = photoById(pid)!;
    return {
      id: `${b.id}-${idx}`,
      title: b.title,
      vehicle: b.vehicle,
      summary: b.summary,
      category: b.category,
      photoSrc: p.src,
      photoAlt: p.alt,
    };
  });
});
---
<BaseLayout title="4×4 Builds Gallery" description="Real lift kits, suspension work, and full 4×4 builds out of Pappytackle in Bellingham, WA.">
  <SectionLight tone="paper">
    <Eyebrow class="!text-[var(--color-ember)]">The showcase</Eyebrow>
    <h1 class="mt-2 text-5xl md:text-6xl">4×4 Builds & Customization</h1>
    <p class="mt-4 max-w-2xl text-lg">Real rigs we’ve built and serviced. Click any photo for the full story.</p>
    <div class="mt-12">
      <BuildGallery client:visible items={items} />
    </div>
    <div class="mt-16">
      <h2 class="text-3xl mb-6">Other recent jobs (photos coming)</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <TodoBlock label="Toyota Sienna 3.5-inch lift" />
        <TodoBlock label="Jeep Gladiator diff service" />
        <TodoBlock label="Ford Transit fuel injectors" />
        <TodoBlock label="GMC Sierra oil service" />
      </div>
    </div>
  </SectionLight>
</BaseLayout>
```

- [ ] **Step 4: Verify in browser, commit**

```bash
# Visit http://localhost:4321/builds and verify filter buttons + lightbox open/close + ESC closes.
git add -A
git commit -m "feat(builds): filterable gallery with lightbox + TODO blocks for missing imagery"
```

### Task 14: Services page

**Files:**
- Create: `src/pages/services.astro`
- Create: `src/components/services/DescribeBuildIsland.tsx`

- [ ] **Step 1: Write `src/components/services/DescribeBuildIsland.tsx`**

```tsx
import { useState } from 'react';

export default function DescribeBuildIsland() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 5) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/ai/suggest-service', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ description: text }),
      });
      if (!res.ok) throw new Error('bad');
      const json = await res.json();
      const cat = json.service_category;
      window.location.href = `/book?category=${encodeURIComponent(cat)}&desc=${encodeURIComponent(text)}`;
    } catch {
      setError("Couldn't suggest a category — head to booking and pick one manually.");
      window.setTimeout(() => { window.location.href = '/book'; }, 1500);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="bg-[var(--color-ink-2)] p-6 rounded-[var(--radius-card)] border border-[var(--color-bone)]/15">
      <label className="block">
        <span className="font-display font-bold uppercase text-sm text-[var(--color-gold)]">Describe what you want built</span>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          placeholder='e.g. "I want a 3-inch lift on my 2018 Tacoma with bigger tires"'
          className="mt-2 w-full p-3 bg-[var(--color-ink)] text-[var(--color-paper)] border border-[var(--color-bone)]/20 rounded-[var(--radius-button)] focus:border-[var(--color-gold)] focus:outline-none" />
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={loading || text.trim().length < 5}
          className="px-5 py-2.5 bg-[var(--color-ember)] text-[var(--color-paper)] font-display font-bold uppercase rounded disabled:opacity-50">
          {loading ? 'Thinking…' : 'Start booking →'}
        </button>
        {error && <span className="text-sm text-[var(--color-gold-light)]">{error}</span>}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Write `src/pages/services.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { services } from '@/data/services';
import { Image } from 'astro:assets';
import SectionLight from '@/components/SectionLight.astro';
import SectionDark from '@/components/SectionDark.astro';
import Eyebrow from '@/components/Eyebrow.astro';
import BadgeDiamond from '@/components/BadgeDiamond.astro';
import DescribeBuildIsland from '@/components/services/DescribeBuildIsland';

import heroSvc from '@/assets/photos/lexus-gx/long-travel-04.jpg';
import bumperImg from '@/assets/photos/tacomas/2017-bumper.jpg';

const standard = services.filter(s => s.category !== '4x4_custom');
const fourByFour = services.find(s => s.category === '4x4_custom')!;
---
<BaseLayout title="Services" description="Standard auto repair plus full off-road 4×4 customization in Bellingham, WA.">
  <SectionLight tone="paper">
    <Eyebrow class="!text-[var(--color-ember)]">What we do</Eyebrow>
    <h1 class="mt-2 text-5xl md:text-6xl">Services</h1>
    <p class="mt-4 max-w-2xl text-lg">A full-service auto shop with serious off-road build chops.</p>
    <div class="mt-12 grid md:grid-cols-2 gap-6">
      {standard.map(s => (
        <article id={s.id} class="p-6 bg-white border border-[var(--color-ink)]/10 rounded-[var(--radius-card)]">
          <h2 class="text-2xl">{s.name}</h2>
          <p class="mt-1 text-sm text-[var(--color-ember)] font-bold uppercase tracking-wider">{s.summary}</p>
          <p class="mt-3 text-[var(--color-ink)]/85 leading-relaxed">{s.body}</p>
        </article>
      ))}
    </div>
  </SectionLight>

  <SectionDark class="!py-0">
    <div class="grid lg:grid-cols-2 gap-12 items-center py-20 md:py-28">
      <div>
        <BadgeDiamond color="gold">The differentiator</BadgeDiamond>
        <h2 id="4x4" class="mt-4 text-5xl md:text-6xl">{fourByFour.name}</h2>
        <p class="mt-4 text-lg text-[var(--color-bone)] leading-relaxed">{fourByFour.body}</p>
        <ul class="mt-8 grid sm:grid-cols-2 gap-3 text-sm">
          {['Bolt-on lift kits','Coil springs & control arms','Long-travel suspension','Bumpers & armor','Custom fab work','Full builds'].map(t => (
            <li class="flex items-center gap-2"><span class="w-1.5 h-1.5 bg-[var(--color-ember)]"></span>{t}</li>
          ))}
        </ul>
        <div class="mt-8"><DescribeBuildIsland client:load /></div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <Image src={heroSvc} alt="Lexus GX long-travel build side profile" class="rounded-[var(--radius-card)] aspect-[4/5] object-cover" widths={[400,600,800]} sizes="(min-width:1024px) 25vw, 50vw" />
        <Image src={bumperImg} alt="2017 Tacoma with custom bumper" class="rounded-[var(--radius-card)] aspect-[4/5] object-cover mt-12" widths={[400,600,800]} sizes="(min-width:1024px) 25vw, 50vw" />
      </div>
    </div>
  </SectionDark>
</BaseLayout>
```

- [ ] **Step 3: Browser verify + commit**

```bash
# Visit /services — verify both sections, click "Start booking" with sample text and confirm it navigates to /book?category=4x4_custom&desc=...
git add -A
git commit -m "feat(services): services page + AI-assisted booking entry"
```

### Task 15: Book page with form + URL prefill

**Files:**
- Create: `src/pages/book.astro`
- Create: `src/pages/book/thanks.astro`
- Create: `src/pages/api/bookings.ts`
- Create: `src/components/book/BookingForm.tsx`
- Modify: `.gitignore` already includes `data/appointments.local.json`

- [ ] **Step 1: Write `src/components/book/BookingForm.tsx`**

```tsx
import { useState } from 'react';

const CATEGORIES = [
  ['maintenance', 'Standard Maintenance'],
  ['diagnostics', 'Engine & Diagnostics'],
  ['hvac', 'Heating & A/C'],
  ['electrical', 'Auto Electrical'],
  ['exhaust', 'Exhaust'],
  ['brakes', 'Brakes'],
  ['oil_change', 'Oil Change'],
  ['4x4_custom', '4×4 Customization'],
] as const;

export default function BookingForm({ defaultCategory, defaultDesc }: { defaultCategory?: string; defaultDesc?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('bad');
      window.location.href = '/book/thanks';
    } catch {
      setError("Couldn't submit — please call us at (360) 543-6990.");
      setSubmitting(false);
    }
  }

  const cls = "w-full p-3 bg-white border border-[var(--color-ink)]/20 rounded-[var(--radius-button)] focus:border-[var(--color-ember)] focus:outline-none";
  const lbl = "block text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]/80 mb-1";

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <label><span className={lbl}>Name *</span><input name="name" required className={cls} /></label>
        <label><span className={lbl}>Phone *</span><input name="phone" type="tel" required className={cls} /></label>
      </div>
      <label><span className={lbl}>Email (optional)</span><input name="email" type="email" className={cls} /></label>
      <label><span className={lbl}>Vehicle (year / make / model) *</span><input name="vehicle" required placeholder="e.g. 2018 Toyota Tacoma" className={cls} /></label>
      <label><span className={lbl}>Service *</span>
        <select name="category" required defaultValue={defaultCategory ?? ''} className={cls}>
          <option value="" disabled>Choose a service</option>
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label><span className={lbl}>Preferred date</span><input name="date" type="date" className={cls} /></label>
        <label><span className={lbl}>Time window</span>
          <select name="time_window" defaultValue="" className={cls}>
            <option value="">Either</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option>
          </select>
        </label>
      </div>
      <label><span className={lbl}>Notes</span><textarea name="notes" rows={4} defaultValue={defaultDesc ?? ''} className={cls} /></label>
      <button disabled={submitting} className="mt-2 px-6 py-3.5 bg-[var(--color-ember)] text-[var(--color-paper)] font-display font-bold uppercase rounded disabled:opacity-50">
        {submitting ? 'Sending…' : 'Request Appointment'}
      </button>
      {error && <p className="text-[var(--color-ember)]">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 2: Write `src/pages/api/bookings.ts`**

```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const prerender = false;

const BookingZ = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(7).max(40),
  email: z.string().email().optional().or(z.literal('')),
  vehicle: z.string().min(2).max(200),
  category: z.enum(['maintenance','diagnostics','hvac','electrical','exhaust','brakes','oil_change','4x4_custom']),
  date: z.string().optional().or(z.literal('')),
  time_window: z.enum(['morning','afternoon','']).optional(),
  notes: z.string().max(2000).optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = BookingZ.parse(await request.json());
    const file = path.resolve('data/appointments.local.json');
    if (!existsSync(path.dirname(file))) await mkdir(path.dirname(file), { recursive: true });
    let arr: unknown[] = [];
    if (existsSync(file)) arr = JSON.parse(await readFile(file, 'utf8'));
    arr.push({ ...data, _receivedAt: new Date().toISOString() });
    await writeFile(file, JSON.stringify(arr, null, 2));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    console.error('[api/bookings]', err?.message ?? err);
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
};
```

- [ ] **Step 3: Write `src/pages/book.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import SectionLight from '@/components/SectionLight.astro';
import Eyebrow from '@/components/Eyebrow.astro';
import CallButton from '@/components/CallButton.astro';
import BookingForm from '@/components/book/BookingForm';

const url = Astro.url;
const defaultCategory = url.searchParams.get('category') ?? undefined;
const defaultDesc = url.searchParams.get('desc') ?? undefined;
---
<BaseLayout title="Book Appointment" description="Request an appointment at Pappytackle 4×4 & Auto in Bellingham, WA.">
  <SectionLight tone="paper">
    <Eyebrow class="!text-[var(--color-ember)]">Schedule</Eyebrow>
    <h1 class="mt-2 text-5xl md:text-6xl">Book an Appointment</h1>
    <p class="mt-4 max-w-2xl text-lg">Tell us what's going on and we'll get back to you with a slot. Prefer to talk?</p>
    <div class="mt-2"><CallButton variant="ghost-on-light" class="!text-[var(--color-ink)] !border-[var(--color-ink)]/30" /></div>
    <div class="mt-10"><BookingForm client:load defaultCategory={defaultCategory} defaultDesc={defaultDesc} /></div>
  </SectionLight>
</BaseLayout>
```

- [ ] **Step 4: Write `src/pages/book/thanks.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import SectionLight from '@/components/SectionLight.astro';
import Button from '@/components/Button.astro';
import CallButton from '@/components/CallButton.astro';
---
<BaseLayout title="Thanks" description="Appointment request received.">
  <SectionLight tone="paper">
    <h1 class="text-5xl md:text-6xl">Thanks — we’ll be in touch.</h1>
    <p class="mt-4 max-w-2xl text-lg">We’ve got your request. You’ll usually hear back within one business day to confirm a time. If it’s urgent, give us a call.</p>
    <div class="mt-8 flex flex-wrap gap-3">
      <Button href="/" variant="ghost-on-light">← Back home</Button>
      <CallButton variant="ghost-on-light" class="!text-[var(--color-ink)] !border-[var(--color-ink)]/30" />
    </div>
  </SectionLight>
</BaseLayout>
```

- [ ] **Step 5: Test submission end-to-end (no Anthropic key needed for this)**

```bash
# Make sure dev server running. Then:
curl -s -X POST http://localhost:4321/api/bookings \
  -H 'content-type: application/json' \
  -d '{"name":"Test","phone":"3605551212","vehicle":"2018 Tacoma","category":"4x4_custom","notes":"3 inch lift"}'
cat data/appointments.local.json
```
Expected: `{"ok":true}` and a JSON file with the entry.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(book): booking form + local JSON sink + thanks page"
```

### Task 16: About / Meet Chance page

**Files:**
- Create: `src/pages/about.astro`

- [ ] **Step 1: Write**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import SectionLight from '@/components/SectionLight.astro';
import SectionDark from '@/components/SectionDark.astro';
import Eyebrow from '@/components/Eyebrow.astro';
import TodoBlock from '@/components/TodoBlock.astro';
import { shop } from '@/data/shop';
import CertStrip from '@/components/CertStrip.astro';
---
<BaseLayout title="About — Meet Chance">
  <SectionLight tone="bone">
    <div class="container-narrow">
      <Eyebrow class="!text-[var(--color-ember)]">About the shop</Eyebrow>
      <h1 class="mt-2 text-5xl md:text-6xl">Meet Chance.</h1>
      <div class="mt-8"><TodoBlock label="Portrait of Chance — replace with real photo" ratio="3/2" /></div>
      <div class="mt-10 prose-lg max-w-none leading-relaxed text-[var(--color-ink)]/90">
        <p class="text-2xl"><span class="float-left mr-3 mt-1 text-7xl font-display font-bold leading-none text-[var(--color-ember)]">P</span>appytackle isn’t a corporate auto chain. It’s one guy who knows what he’s doing, one bay at a time, in a small shop on Sunset Pond Ln in Bellingham.</p>
        <p class="mt-6">Chance has been working on cars and trucks for over a decade. ASE Certified. The kind of mechanic who tells you when you don’t need a repair, and explains exactly what he found when you do.</p>
        <p class="mt-6">Most days, that means oil changes, brakes, A/C work, diagnostics, exhaust — the usual stuff a daily driver needs. But on the days when someone rolls in with a Tacoma that needs a 3-inch lift, or a Lexus GX that wants long-travel suspension, that’s where Pappytackle really opens up. Chance builds rigs the way he’d build his own — proper geometry, real alignment, no compromises that bite you on the trail.</p>
        <p class="mt-6">If you’re local and you want a shop that picks up the phone and tells you the truth, you found one.</p>
      </div>
      <div class="mt-10"><TodoBlock label="Shop exterior or interior — replace with real photo" ratio="16/9" /></div>
    </div>
  </SectionLight>
  <SectionDark>
    <div class="text-center">
      <Eyebrow>Trusted by</Eyebrow>
      <CertStrip />
      <p class="mt-6 text-2xl">{shop.reviewStats.average} stars · {shop.reviewStats.count}+ verified reviews</p>
    </div>
  </SectionDark>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(about): meet chance long-form page with drop cap"
```

### Task 17: Reviews page

**Files:**
- Create: `src/pages/reviews.astro`
- Create: `src/components/reviews/ReviewWall.tsx`

- [ ] **Step 1: Write `src/components/reviews/ReviewWall.tsx`**

```tsx
import { useState, useMemo } from 'react';

interface Review { id: string; rating: 1|2|3|4|5; name: string; date: string; body: string; }

export default function ReviewWall({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<5 | 4 | 3>(5);
  const filtered = useMemo(() => reviews.filter(r => r.rating >= filter), [filter, reviews]);
  const filters: { v: 5|4|3; l: string }[] = [{ v: 5, l: '5 stars' }, { v: 4, l: '4+ stars' }, { v: 3, l: '3+ stars' }];

  return (
    <div>
      <div className="flex gap-2 mb-8">
        {filters.map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2 font-display font-bold uppercase text-sm rounded ${filter === f.v ? 'bg-[var(--color-ember)] text-[var(--color-paper)]' : 'border border-[var(--color-ink)]/25 hover:border-[var(--color-ember)]'}`}>
            {f.l}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map(r => (
          <figure key={r.id} className="p-6 bg-white border border-[var(--color-ink)]/10 rounded-[var(--radius-card)]">
            <div className="flex gap-0.5" aria-label={`${r.rating} of 5 stars`}>
              {Array.from({length: 5}, (_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < r.rating ? 'var(--color-gold)' : 'none'} stroke="var(--color-gold)" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <blockquote className="mt-3 leading-relaxed">"{r.body}"</blockquote>
            <figcaption className="mt-4 text-sm text-[var(--color-ink)]/65">— {r.name} · {r.date}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/pages/reviews.astro`**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import SectionLight from '@/components/SectionLight.astro';
import Eyebrow from '@/components/Eyebrow.astro';
import ReviewWall from '@/components/reviews/ReviewWall';
import { reviews } from '@/data/reviews';
import { shop } from '@/data/shop';

const items = reviews.map(({ _isSample, ...r }) => r);
---
<BaseLayout title="Reviews">
  <SectionLight tone="paper">
    <Eyebrow class="!text-[var(--color-ember)]">Reviews</Eyebrow>
    <h1 class="mt-2 text-5xl md:text-6xl">{shop.reviewStats.average} stars · {shop.reviewStats.count}+ reviews</h1>
    <p class="mt-4 max-w-2xl text-lg">Real words from real customers.</p>
    <div class="mt-12"><ReviewWall client:visible reviews={items} /></div>
  </SectionLight>
</BaseLayout>
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(reviews): filterable review wall (sample placeholders flagged in data)"
```

### Task 18: Contact page

**Files:**
- Create: `src/pages/contact.astro`

- [ ] **Step 1: Write**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import SectionLight from '@/components/SectionLight.astro';
import SectionDark from '@/components/SectionDark.astro';
import Eyebrow from '@/components/Eyebrow.astro';
import Button from '@/components/Button.astro';
import CallButton from '@/components/CallButton.astro';
import { shop } from '@/data/shop';

// OpenStreetMap embed — no API key needed.
const { lat, lng } = shop.geo;
const bbox = `${lng - 0.01},${lat - 0.005},${lng + 0.01},${lat + 0.005}`;
const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
const addr = encodeURIComponent(`${shop.address.line1}, ${shop.address.city}, ${shop.address.state} ${shop.address.zip}`);
---
<BaseLayout title="Contact">
  <SectionLight tone="paper">
    <Eyebrow class="!text-[var(--color-ember)]">Get in touch</Eyebrow>
    <h1 class="mt-2 text-5xl md:text-6xl">Contact</h1>
    <div class="mt-12 grid md:grid-cols-2 gap-12">
      <div>
        <h2 class="text-2xl">Visit</h2>
        <address class="mt-3 not-italic leading-relaxed text-lg">
          {shop.address.line1}<br/>{shop.address.city}, {shop.address.state} {shop.address.zip}
        </address>
        <h2 class="mt-8 text-2xl">Hours</h2>
        <ul class="mt-3 leading-relaxed">
          {shop.hours.map(h => (
            <li class="flex justify-between max-w-xs"><span>{h.day}</span><span>{h.open ? `${h.open}–${h.close}` : 'Closed'}</span></li>
          ))}
        </ul>
        <div class="mt-8 flex flex-wrap gap-3">
          <CallButton variant="ghost-on-light" class="!text-[var(--color-ink)] !border-[var(--color-ink)]/30" />
          <Button href={`https://maps.apple.com/?address=${addr}`} variant="ember">Directions</Button>
        </div>
      </div>
      <div class="aspect-square rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-ink)]/15">
        <iframe title="Map" src={mapSrc} class="w-full h-full" loading="lazy" />
      </div>
    </div>
  </SectionLight>
</BaseLayout>
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat(contact): map embed, hours, click-to-call, directions"
```

### Task 19: Floating chat island (global)

**Files:**
- Create: `src/components/chat/ChatWidget.tsx`, `ChatMount.astro`
- Modify: `src/layouts/BaseLayout.astro` to mount ChatMount

- [ ] **Step 1: Write `src/components/chat/ChatWidget.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
const STARTERS = [
  'Do you work on Jeeps?',
  'What does a 3-inch lift on a Tacoma run?',
  'Is the noise I’m hearing serious?',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs]);

  async function send(text: string) {
    const userMsg: Msg = { role: 'user', content: text };
    const history = [...msgs, userMsg];
    setMsgs([...history, { role: 'assistant', content: '' }]);
    setInput(''); setStreaming(true);

    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history }), signal: ctrl.signal,
      });
      if (!res.body) throw new Error('no body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n\n'); buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.delta) {
              setMsgs(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content + evt.delta };
                return next;
              });
            } else if (evt.error) {
              setMsgs(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: evt.error };
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setMsgs(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: "Sorry — assistant unavailable. Call (360) 543-6990." };
          return next;
        });
      }
    } finally { setStreaming(false); abortRef.current = null; }
  }

  return (
    <>
      <button aria-label="Open chat" onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[var(--color-ember)] text-[var(--color-paper)] shadow-lg hover:bg-[var(--color-ember-dark)] grid place-items-center transition-transform hover:scale-105 ${open ? 'opacity-0 pointer-events-none' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Ask Pappytackle"
          className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[440px] md:max-h-[640px] md:rounded-[var(--radius-card)] z-40 bg-[var(--color-ink)] text-[var(--color-paper)] flex flex-col shadow-2xl overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-bone)]/15">
            <div>
              <p className="font-display font-bold uppercase tracking-wide">Ask Pappytackle</p>
              <p className="text-xs text-[var(--color-bone)]/60">We usually reply in seconds. For urgent things, call (360) 543-6990.</p>
            </div>
            <button aria-label="Close" onClick={() => setOpen(false)} className="p-2 text-[var(--color-bone)]/80 hover:text-[var(--color-paper)]">✕</button>
          </header>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {msgs.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-bone)]/80">Hey — what can we help with?</p>
                <div className="flex flex-col gap-2">
                  {STARTERS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-left text-sm px-3 py-2 border border-[var(--color-bone)]/20 rounded hover:bg-[var(--color-ink-2)]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-[var(--color-ember)] text-[var(--color-paper)]' : 'bg-[var(--color-ink-2)] text-[var(--color-bone)]'}`}>
                  {m.content || (streaming && i === msgs.length - 1 ? '…' : '')}
                </div>
              </div>
            ))}
          </div>
          <form className="border-t border-[var(--color-bone)]/15 p-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (input.trim() && !streaming) send(input.trim()); }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a question…"
              className="flex-1 px-3 py-2 bg-[var(--color-ink-2)] border border-[var(--color-bone)]/15 rounded text-[var(--color-paper)] focus:border-[var(--color-gold)] focus:outline-none" />
            <button type="submit" disabled={streaming || !input.trim()}
              className="px-3 py-2 bg-[var(--color-ember)] rounded disabled:opacity-50">→</button>
          </form>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Write `src/components/chat/ChatMount.astro`**

```astro
---
import ChatWidget from './ChatWidget';
---
<ChatWidget client:idle />
```

- [ ] **Step 3: Mount in `BaseLayout.astro`**

Edit `src/layouts/BaseLayout.astro` to add `<ChatMount />` right before `</body>`:

```astro
---
import ChatMount from '@/components/chat/ChatMount.astro';
// ...existing imports
---
<!-- existing markup -->
<ChatMount />
</body>
```

- [ ] **Step 4: Verify (with ANTHROPIC_API_KEY set in `.env.local`)**

```bash
# Restart dev server. Open any page. Click floating chat button. Click a starter prompt. Verify streaming.
```

Acceptance:
- Button visible on every page, bottom-right.
- ESC closes overlay.
- First-open shows three starter chips.
- Sending a message streams response token-by-token.
- Without key: shows the friendly error message.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(chat): global floating chat widget with streaming"
```

---

## Phase 3 — Polish

### Task 20: SEO + JSON-LD

**Files:**
- Create: `src/components/seo/JsonLd.astro`
- Modify: `src/layouts/BaseLayout.astro`
- Create: `public/robots.txt`

- [ ] **Step 1: Write `src/components/seo/JsonLd.astro`**

```astro
---
import { shop } from '@/data/shop';
import { services } from '@/data/services';

const baseUrl = Astro.site?.href ?? 'http://localhost:4321';

const businessJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['AutoRepair', 'LocalBusiness'],
  name: shop.name,
  image: `${baseUrl}og-default.jpg`,
  url: baseUrl,
  telephone: `+1${shop.phone}`,
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: shop.address.line1,
    addressLocality: shop.address.city,
    addressRegion: shop.address.state,
    postalCode: shop.address.zip,
    addressCountry: 'US',
  },
  geo: { '@type': 'GeoCoordinates', latitude: shop.geo.lat, longitude: shop.geo.lng },
  openingHoursSpecification: shop.hours.filter(h => h.open).map(h => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: { Mon:'Monday',Tue:'Tuesday',Wed:'Wednesday',Thu:'Thursday',Fri:'Friday',Sat:'Saturday',Sun:'Sunday' }[h.day],
    opens: h.open, closes: h.close,
  })),
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: shop.reviewStats.average,
    reviewCount: shop.reviewStats.count,
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog', name: 'Services',
    itemListElement: services.map(s => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s.name, description: s.summary },
    })),
  },
};
---
<script type="application/ld+json" set:html={JSON.stringify(businessJsonLd)} />
```

- [ ] **Step 2: Insert into `BaseLayout.astro` `<head>`**

```astro
import JsonLd from '@/components/seo/JsonLd.astro';
<!-- ... in <head> -->
<JsonLd />
```

- [ ] **Step 3: Create `public/robots.txt`**

```
User-agent: *
Allow: /
Sitemap: /sitemap-index.xml
```

- [ ] **Step 4: Build + verify JSON-LD**

```bash
npm run build && npm run preview -- --port 4322 &
sleep 4
curl -s http://localhost:4322 | grep -c 'application/ld+json'
kill %1
```
Expected: `≥ 1`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(seo): localbusiness/autorepair json-ld, robots.txt"
```

### Task 21: Favicon + OG image

**Files:**
- Create: `public/favicon.png`, `public/og-default.jpg`

- [ ] **Step 1: Generate favicon from Yellow Tire Mark**

```bash
sips -s format png -z 512 512 src/assets/logos/tire-mark-yellow.png --out public/favicon.png
```

- [ ] **Step 2: Use Lexus hero as OG default (1200×630)**

```bash
sips -s format jpeg -s formatOptions 85 -z 630 1200 -c 630 1200 src/assets/photos/lexus-gx/long-travel-01.jpg --out public/og-default.jpg
```

- [ ] **Step 3: Commit**

```bash
git add public/
git commit -m "chore: favicon + default og image from real photography"
```

### Task 22: Accessibility & contrast pass

**Files:**
- Manual review across all pages

- [ ] **Step 1: Add Playwright smoke**

Create `tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

const PAGES = ['/', '/builds', '/services', '/book', '/about', '/reviews', '/contact'];

for (const p of PAGES) {
  test(`page ${p} renders without console errors and has h1`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    const resp = await page.goto(`http://localhost:4321${p}`);
    expect(resp?.status()).toBe(200);
    const h1 = await page.locator('h1').first().textContent();
    expect(h1?.trim().length).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}
```

Create `playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  webServer: { command: 'npm run dev -- --port 4321', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 30_000 },
  use: { baseURL: 'http://localhost:4321' },
});
```

Add npm script:
```json
"test:e2e": "playwright test"
```

- [ ] **Step 2: Run smoke**

```bash
npx playwright install chromium
npm run test:e2e
```
Expected: all pages pass.

- [ ] **Step 3: Manual a11y checklist (in browser)**

For each page, verify:
- Tab through entire page — focus rings visible, logical order.
- All images have descriptive alt (right-click → inspect).
- Hit Cmd+Opt+F5 in Safari to surface alt text issues, or use Chrome DevTools Lighthouse "Accessibility" pass.
- Chat overlay: ESC closes, focus trapped while open, screen reader announces "dialog".
- Mobile menu: opens, all links keyboard-reachable, close on link click.
- Color contrast: bone-on-ink, ember-on-paper, gold-on-ink all pass AA at body sizes (use Chrome DevTools color picker → contrast ratio).
- `prefers-reduced-motion`: enable in OS, reload home — hero video still plays muted, no parallax/scroll animations.

- [ ] **Step 4: Commit fixes if any**

```bash
git add -A
git commit -m "test(e2e): smoke tests + accessibility pass" || true
```

### Task 23: README + env

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Pappytackle 4×4 & Auto

Marketing site for Pappytackle 4×4 & Auto (Bellingham, WA) with embedded Claude-powered features.

## Local setup

```bash
cp .env.example .env.local
# Add ANTHROPIC_API_KEY=sk-ant-... to .env.local
npm install
npm run import-assets   # one-time — processes ~/Desktop/Pappytackle photography
npm run dev             # http://localhost:4321
```

`ANTHROPIC_API_KEY` is required for the four AI features (diagnose, suggest-service, chat, search). The rest of the site renders without it.

## Project structure

```
src/
├── pages/            # Astro pages + /api endpoints
├── layouts/          # BaseLayout
├── components/       # UI primitives + page sections + React islands
├── lib/ai/           # Anthropic SDK wrapper, schemas, features
├── data/             # shop, services, photos, reviews, builds (flat TS)
├── assets/           # Processed photography + logos (gitignored sources stay on Desktop)
└── styles/           # global.css (Tailwind v4 + design tokens)

scripts/import-assets.sh   # idempotent asset import
data/appointments.local.json   # local-only booking sink (gitignored)
```

## AI features

All four features live in `src/lib/ai/features/` and expose typed functions. Each has a matching API endpoint under `src/pages/api/ai/`. The shared shop context (`shopContext.ts`) is cached via Anthropic's prompt caching — one source of truth, reused across calls.

- `diagnose({ symptom, vehicle? })` — tool-use, returns structured non-alarmist diagnosis.
- `suggestService({ description })` — maps free text to a service category.
- `search({ query })` — single Claude call over services + recent jobs; ranked results.
- `streamReply(history)` — Sonnet, SSE streaming, grounded in shop context.

## Updating content

- **Services:** `src/data/services.ts`
- **Recent jobs:** `src/data/recentJobs.ts`
- **Builds (the showcase):** `src/data/builds.ts`
- **Reviews:** `src/data/reviews.ts` — flip or remove `_isSample: true` after pasting real verbatim review text.
- **Shop info:** `src/data/shop.ts`

## Updating photography

1. Drop new files into `~/Desktop/Pappytackle/PHOTOS/<category>/`.
2. Add a line to `scripts/import-assets.sh` (JPG_MAP or HEIC_MAP).
3. Add the import + Photo entry in `src/data/photos.ts`.
4. Reference by id from `builds.ts` or `recentJobs.ts`.

## Before deploying

This pass is **local-dev only**. Before going live:

1. **Secrets:** move `ANTHROPIC_API_KEY` to the host env var (Netlify, Vercel, Fly). Never commit `.env.local`.
2. **Rate limiting:** add per-IP rate limiting on every `/api/ai/*` endpoint and `/api/bookings`. Suggested: Upstash Ratelimit (free tier, 10 r/min per IP per endpoint).
3. **Appointments sink:** replace `data/appointments.local.json` with email (Resend / Postmark) and/or CRM (whatever Chance uses).
4. **Reviews:** replace sample placeholders with real verbatim text from the shop's Google Business page; flip `_isSample` off.
5. **TODO imagery:** replace TODO blocks on About (Chance + shop interior) and 4×4 Builds (Sienna, Gladiator, Transit, Sierra) with real photography.
6. **Lighthouse:** run a full Lighthouse pass and fix any AA contrast / perf / SEO regressions.
7. **Map embed:** confirm the `shop.geo` coordinates point at the real shop location (currently approximate Bellingham).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with local setup, AI feature map, before-deploy checklist"
```

### Task 24: Final sweep & build verification

- [ ] **Step 1: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: build succeeds.

- [ ] **Step 3: Full unit test sweep**

```bash
npm test
```
Expected: all suites pass.

- [ ] **Step 4: E2E sweep**

```bash
npm run test:e2e
```
Expected: all pages pass.

- [ ] **Step 5: Final commit (if any cleanup)**

```bash
git status
git commit -am "chore: final pass" || true
git log --oneline
```

---

## Self-Review Summary

**Spec coverage:**
- §2 Stack → Task 1 ✓
- §3 Design system → Task 3, 11 ✓
- §4 Pages (all 7) → Tasks 12, 13, 14, 15, 16, 17, 18 ✓
- §5 Global UI → Task 4 (nav, footer), Task 19 (chat) ✓
- §6 AI module → Tasks 6, 7, 8, 9, 10 ✓
- §7 Data files → Task 5 ✓
- §8 Asset pipeline → Task 2 ✓
- §9 SEO → Task 20 ✓
- §10 Env, §11 README → Task 23 ✓
- §12 Non-goals → respected (no rate limiting, no deploy config, no CMS) ✓

**Type consistency:** verified — `ServiceCategory` enum identical across `data/types.ts` and `lib/ai/schemas.ts`; `Photo.id` strings used in `builds.photoIds` and `recentJobs.photoIds` match `photos.ts` ids; AI feature names (`diagnose`, `suggestService`, `search`, `streamReply`) consistent across lib, endpoints, and chat client.

**Acceptance for the whole plan:** a developer can `git clone`, set `ANTHROPIC_API_KEY`, `npm install && npm run import-assets && npm run dev`, and have the full site running with all 4 AI features functional and all 7 pages rendering real photography.
