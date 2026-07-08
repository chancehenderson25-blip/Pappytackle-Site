import { useState } from 'react';

const CATEGORIES = [
  ['maintenance', 'Standard Maintenance'],
  ['diagnostics', 'Engine & Diagnostics'],
  ['hvac', 'Heating & A/C'],
  ['electrical', 'Auto Electrical'],
  ['exhaust', 'Exhaust'],
  ['brakes', 'Brakes'],
  ['oil_change', 'Oil Change'],
  ['4x4_custom', '4×4 Customization'],
] as const;

export default function BookingForm({ defaultCategory, defaultDesc }: { defaultCategory?: string; defaultDesc?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('bad');
      window.location.href = '/book/thanks';
    } catch {
      setError("Couldn't submit — please call us at (360) 543-6990.");
      setSubmitting(false);
    }
  }

  const cls = "w-full p-3 bg-white border border-[var(--color-ink)]/20 rounded-[var(--radius-button)] focus:border-[var(--color-ember)] focus:outline-none";
  const lbl = "block text-sm font-bold uppercase tracking-wider text-[var(--color-ink)]/80 mb-1";

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <label><span className={lbl}>Name *</span><input name="name" required className={cls} /></label>
        <label><span className={lbl}>Phone *</span><input name="phone" type="tel" required className={cls} /></label>
      </div>
      <label><span className={lbl}>Email (optional)</span><input name="email" type="email" className={cls} /></label>
      <label><span className={lbl}>Vehicle (year / make / model) *</span><input name="vehicle" required placeholder="e.g. 2018 Toyota Tacoma" className={cls} /></label>
      <label><span className={lbl}>Service *</span>
        <select name="category" required defaultValue={defaultCategory ?? ''} className={cls}>
          <option value="" disabled>Choose a service</option>
          {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      <div className="grid sm:grid-cols-2 gap-4">
        <label><span className={lbl}>Preferred date</span><input name="date" type="date" className={cls} /></label>
        <label><span className={lbl}>Time window</span>
          <select name="time_window" defaultValue="" className={cls}>
            <option value="">Either</option><option value="morning">Morning</option><option value="afternoon">Afternoon</option>
          </select>
        </label>
      </div>
      <label><span className={lbl}>Notes</span><textarea name="notes" rows={4} defaultValue={defaultDesc ?? ''} className={cls} /></label>
      <button disabled={submitting} className="mt-2 px-6 py-3.5 bg-[var(--color-ember)] text-[var(--color-paper)] font-display font-bold uppercase rounded disabled:opacity-50">
        {submitting ? 'Sending…' : 'Request Appointment'}
      </button>
      {error && <p className="text-[var(--color-ember)]">{error}</p>}
    </form>
  );
}
