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
