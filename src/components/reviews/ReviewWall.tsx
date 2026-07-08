import { useState, useMemo } from 'react';

interface Review { id: string; rating: 1|2|3|4|5; name: string; date: string; body: string; }

export default function ReviewWall({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<5 | 4 | 3>(5);
  const filtered = useMemo(() => reviews.filter(r => r.rating >= filter), [filter, reviews]);
  const filters: { v: 5|4|3; l: string }[] = [{ v: 5, l: '5 stars' }, { v: 4, l: '4+ stars' }, { v: 3, l: '3+ stars' }];

  return (
    <div>
      <div className="flex gap-2 mb-8">
        {filters.map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-4 py-2 font-display font-bold uppercase text-sm rounded ${filter === f.v ? 'bg-[var(--color-ember)] text-[var(--color-paper)]' : 'border border-[var(--color-ink)]/25 hover:border-[var(--color-ember)]'}`}>
            {f.l}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map(r => (
          <figure key={r.id} className="p-6 bg-white border border-[var(--color-ink)]/10 rounded-[var(--radius-card)]">
            <div className="flex gap-0.5" aria-label={`${r.rating} of 5 stars`}>
              {Array.from({length: 5}, (_, i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < r.rating ? 'var(--color-gold)' : 'none'} stroke="var(--color-gold)" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <blockquote className="mt-3 leading-relaxed">"{r.body}"</blockquote>
            <figcaption className="mt-4 text-sm text-[var(--color-ink)]/65">— {r.name} · {r.date}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
