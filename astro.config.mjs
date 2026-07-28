import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  output: 'server',
  // imageService: use Vercel's Image Optimization API in production. Astro's
  // own /_image endpoint 404s on Vercel in server output — the deployed
  // function can't read the original files out of the static output — so
  // every <Image> on the site rendered broken.
  adapter: vercel({ imageService: true }),
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  image: { domains: [] },
});
