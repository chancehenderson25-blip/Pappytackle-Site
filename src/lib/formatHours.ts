type Hour = { readonly day: string; readonly open: string | null; readonly close: string | null };

/** "08:00" -> "8a", "17:00" -> "5p", "08:30" -> "8:30a" */
export function formatTime(t: string): string {
  const [hRaw, mRaw] = t.split(':');
  let h = Number(hRaw);
  const m = Number(mRaw);
  const suffix = h >= 12 ? 'p' : 'a';
  h = h % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')}${suffix}` : `${h}${suffix}`;
}

/** "8a–5p" for an open day, "Closed" otherwise. */
export function formatDayHours(h: Hour): string {
  return h.open && h.close ? `${formatTime(h.open)}–${formatTime(h.close)}` : 'Closed';
}

/**
 * Collapses consecutive days that share the same hours into readable lines,
 * e.g. ['Mon–Fri 8a–5p', 'Sat & Sun closed']. Used anywhere hours are shown
 * as a summary rather than a full day-by-day table.
 */
export function formatHourLines(hours: readonly Hour[]): string[] {
  const runs: { days: string[]; label: string }[] = [];
  for (const h of hours) {
    const label = h.open && h.close ? `${formatTime(h.open)}–${formatTime(h.close)}` : 'closed';
    const last = runs[runs.length - 1];
    if (last && last.label === label) last.days.push(h.day);
    else runs.push({ days: [h.day], label });
  }
  return runs.map(r => {
    const d = r.days.length === 1 ? r.days[0]
      : r.days.length === 2 ? `${r.days[0]} & ${r.days[1]}`
      : `${r.days[0]}–${r.days[r.days.length - 1]}`;
    return `${d} ${r.label}`;
  });
}
