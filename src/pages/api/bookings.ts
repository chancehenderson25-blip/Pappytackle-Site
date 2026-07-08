import type { APIRoute } from 'astro';
import { z } from 'zod';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const prerender = false;

const BookingZ = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(7).max(40),
  email: z.string().email().optional().or(z.literal('')),
  vehicle: z.string().min(2).max(200),
  category: z.enum(['maintenance','diagnostics','hvac','electrical','exhaust','brakes','oil_change','4x4_custom']),
  date: z.string().optional().or(z.literal('')),
  time_window: z.enum(['morning','afternoon','']).optional(),
  notes: z.string().max(2000).optional(),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = BookingZ.parse(await request.json());
    const file = path.resolve('data/appointments.local.json');
    if (!existsSync(path.dirname(file))) await mkdir(path.dirname(file), { recursive: true });
    let arr: unknown[] = [];
    if (existsSync(file)) arr = JSON.parse(await readFile(file, 'utf8'));
    arr.push({ ...data, _receivedAt: new Date().toISOString() });
    await writeFile(file, JSON.stringify(arr, null, 2));
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    console.error('[api/bookings]', err?.message ?? err);
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
};
