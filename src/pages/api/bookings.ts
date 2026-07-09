import type { APIRoute } from 'astro';
import { z } from 'zod';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';

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

const CATEGORY_LABELS: Record<string, string> = {
  maintenance: 'Standard Maintenance',
  diagnostics: 'Engine & Diagnostics',
  hvac: 'Heating & A/C',
  electrical: 'Auto Electrical',
  exhaust: 'Exhaust',
  brakes: 'Brakes',
  oil_change: 'Oil Change',
  '4x4_custom': '4×4 Customization',
};

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY;
const TO_EMAIL = import.meta.env.BOOKINGS_TO_EMAIL ?? process.env.BOOKINGS_TO_EMAIL ?? '';
// If pappytackle.com is verified in Resend, switch this to an address on that
// domain (e.g. bookings@pappytackle.com). Until then, Resend's shared sender
// works with zero DNS setup.
const FROM_EMAIL = import.meta.env.BOOKINGS_FROM_EMAIL
  ?? process.env.BOOKINGS_FROM_EMAIL
  ?? 'onboarding@resend.dev';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function saveLocalCopy(entry: Record<string, unknown>) {
  // Best-effort backup log. Vercel's serverless filesystem is read-only
  // outside /tmp, so this throws in production — that's fine, email is the
  // real delivery path there. Swallow the error rather than failing the
  // booking submission.
  try {
    const file = path.resolve('data/appointments.local.json');
    if (!existsSync(path.dirname(file))) await mkdir(path.dirname(file), { recursive: true });
    let arr: unknown[] = [];
    if (existsSync(file)) arr = JSON.parse(await readFile(file, 'utf8'));
    arr.push(entry);
    await writeFile(file, JSON.stringify(arr, null, 2));
  } catch (err) {
    console.warn('[api/bookings] local backup write skipped:', (err as Error)?.message ?? err);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = BookingZ.parse(await request.json());

    await saveLocalCopy({ ...data, _receivedAt: new Date().toISOString() });

    if (resend && TO_EMAIL) {
      const subject = `New booking: ${data.name} — ${data.vehicle}`;
      const lines = [
        `New appointment request from the website.`,
        ``,
        `Name:     ${data.name}`,
        `Phone:    ${data.phone}`,
        `Email:    ${data.email || '(not provided)'}`,
        `Vehicle:  ${data.vehicle}`,
        `Service:  ${CATEGORY_LABELS[data.category] ?? data.category}`,
        `Date:     ${data.date || '(not specified)'}`,
        `Window:   ${data.time_window || 'either'}`,
        ``,
        `Notes:`,
        data.notes || '(none)',
        ``,
        `Received: ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} (Pacific)`,
      ];

      const { error: emailErr } = await resend.emails.send({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        replyTo: data.email || undefined,
        subject,
        text: lines.join('\n'),
      });

      if (emailErr) {
        console.error('[api/bookings] email send failed:', emailErr);
      }
    } else {
      console.warn('[api/bookings] RESEND_API_KEY or BOOKINGS_TO_EMAIL not set — booking not emailed.');
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: any) {
    console.error('[api/bookings]', err?.message ?? err);
    return new Response(JSON.stringify({ error: 'invalid' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
};
