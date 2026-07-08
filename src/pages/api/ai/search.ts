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
