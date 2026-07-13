import type { APIRoute } from 'astro';
import { suggestService } from '@/lib/ai/features/suggestService';
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
    const r = await suggestService(await request.json());
    return new Response(JSON.stringify(r), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    console.error('[api/ai/suggest-service]', err?.message ?? err);
    return new Response(JSON.stringify({ error: "Couldn't process that — try again or call (360) 543-6990." }),
      { status: 502, headers: { 'content-type': 'application/json' } });
  }
};
