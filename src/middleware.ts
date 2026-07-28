import { defineMiddleware } from 'astro:middleware';

// Toggle by setting MAINTENANCE_MODE=true in Vercel and redeploying (or
// triggering a redeploy after changing it — env var changes don't apply to
// already-built deployments). Booking stays reachable on purpose so leads
// aren't lost while the rest of the site is gated.
const EXEMPT_PATHS = new Set(['/maintenance', '/book', '/book/thanks']);
const EXEMPT_PREFIXES = ['/api/bookings', '/_astro/', '/favicon', '/og-default', '/robots.txt', '/sitemap', '/videos/'];

export const onRequest = defineMiddleware(async (context, next) => {
  const enabled = (import.meta.env.MAINTENANCE_MODE ?? process.env.MAINTENANCE_MODE) === 'true';
  if (!enabled) return next();

  const { pathname } = context.url;
  const exempt = EXEMPT_PATHS.has(pathname) || EXEMPT_PREFIXES.some(p => pathname.startsWith(p));
  if (exempt) return next();

  return context.rewrite('/maintenance');
});
