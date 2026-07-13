import type { APIRoute } from 'astro';
import { search } from '@/lib/ai/features/search';
import { checkRateLimit, clientIp } from '@/lib/rateLimit';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const limit = await checkRateLimit(clientIp(request, clientAddress));
  if (!limit.ok) {
    return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
      status: 429,
      headers: { 'content-type': 'application/json', 'retry-after': String(limit.retryAfterSeconds) },
    });
  }

  try {
    const r = await search(await request.json());
    return new Response(JSON.stringify(r), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    console.error('[api/ai/search]', err?.message ?? err);
    return new Response(JSON.stringify({ error: 'Search is unavailable right now.' }),
      { status: 502, headers: { 'content-type': 'application/json' } });
  }
};
