// HANDOFF: This file is meant to REPLACE src/pages/api/bookings.ts after
// Resend is set up (see Step 3 in HANDOFF.txt).
//
// It does everything the original endpoint did (Zod validation, write a
// local JSON copy) and additionally emails the submission to whoever is
// configured in BOOKINGS_TO_EMAIL.

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

const resend = new Resend(import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY);
const TO_EMAIL = import.meta.env.BOOKINGS_TO_EMAIL ?? process.env.BOOKINGS_TO_EMAIL ?? '';
// If you verified pappytackle.com in Resend, use a domain address like
// bookings@pappytackle.com. Otherwise use Resend's onboarding sender.
const FROM_EMAIL = import.meta.env.BOOKINGS_FROM_EMAIL
  ?? process.env.BOOKINGS_FROM_EMAIL
  ?? 'onboarding@resend.dev';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = BookingZ.parse(await request.json());

    // Still save a local copy (harmless, useful as a backup log on the server).
    const file = path.resolve('data/appointments.local.json');
    if (!existsSync(path.dirname(file))) await mkdir(path.dirname(file), { recursive: true });
    let arr: unknown[] = [];
    if (existsSync(file)) arr = JSON.parse(await readFile(file, 'utf8'));
    arr.push({ ...data, _receivedAt: new Date().toISOString() });
    await writeFile(file, JSON.stringify(arr, null, 2));

    // Send the email if Resend is configured. If not, fall through — the
    // booking still gets saved locally so nothing is lost.
    if (TO_EMAIL && (import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY)) {
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
      const text = lines.join('\n');

      const { error: emailErr } = await resend.emails.send({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        replyTo: data.email || undefined,
        subject,
        text,
      });

      if (emailErr) {
        console.error('[api/bookings] email send failed:', emailErr);
        // Don't fail the request — booking is saved, customer gets confirmation,
        // but log the failure so it can be debugged.
      }
    } else {
      console.warn('[api/bookings] RESEND_API_KEY or BOOKINGS_TO_EMAIL not set — booking saved locally but no email sent.');
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[api/bookings]', err?.message ?? err);
    return new Response(JSON.stringify({ error: 'invalid' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
};
