import type { APIRoute } from 'astro';
import { diagnose } from '@/lib/ai/features/diagnose';
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
