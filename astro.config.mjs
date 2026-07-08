import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321',
  output: 'server',
  adapter: vercel(),
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
  image: { domains: [] },
});
