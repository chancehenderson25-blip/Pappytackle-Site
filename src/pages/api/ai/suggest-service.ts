import type { APIRoute } from 'astro';
import { suggestService } from '@/lib/ai/features/suggestService';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const r = await suggestService(await request.json());
    return new Response(JSON.stringify(r), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    console.error('[api/ai/suggest-service]', err?.message ?? err);
    return new Response(JSON.stringify({ error: "Couldn't process that — try again or call (360) 543-6990." }),
      { status: 502, headers: { 'content-type': 'application/json' } });
  }
};
