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
