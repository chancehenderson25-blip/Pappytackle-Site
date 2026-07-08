import { useState } from 'react';

export default function DescribeBuildIsland() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 5) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/ai/suggest-service', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ description: text }),
      });
      if (!res.ok) throw new Error('bad');
      const json = await res.json();
      const cat = json.service_category;
      window.location.href = `/book?category=${encodeURIComponent(cat)}&desc=${encodeURIComponent(text)}`;
    } catch {
      setError("Couldn't suggest a category — head to booking and pick one manually.");
      window.setTimeout(() => { window.location.href = '/book'; }, 1500);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="bg-[var(--color-ink-2)] p-6 rounded-[var(--radius-card)] border border-[var(--color-bone)]/15">
      <label className="block">
        <span className="font-display font-bold uppercase text-sm text-[var(--color-gold)]">Describe what you want built</span>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          placeholder='e.g. "I want a 3-inch lift on my 2018 Tacoma with bigger tires"'
          className="mt-2 w-full p-3 bg-[var(--color-ink)] text-[var(--color-paper)] border border-[var(--color-bone)]/20 rounded-[var(--radius-button)] focus:border-[var(--color-gold)] focus:outline-none" />
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={loading || text.trim().length < 5}
          className="px-5 py-2.5 bg-[var(--color-ember)] text-[var(--color-paper)] font-display font-bold uppercase rounded disabled:opacity-50">
          {loading ? 'Thinking…' : 'Start booking →'}
        </button>
        {error && <span className="text-sm text-[var(--color-gold-light)]">{error}</span>}
      </div>
    </form>
  );
}
