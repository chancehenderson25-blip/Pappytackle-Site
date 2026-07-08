import { useMemo, useState } from 'react';
import Lightbox from './Lightbox';

type Cat = 'all' | 'lift' | 'suspension' | 'long-travel' | 'bumper' | 'full';
const CATS: { id: Cat; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'lift', label: 'Lift Kits' },
  { id: 'suspension', label: 'Suspension' },
  { id: 'long-travel', label: 'Long-Travel' },
  { id: 'bumper', label: 'Bumpers' },
  { id: 'full', label: 'Full Builds' },
];

interface Item { id: string; title: string; vehicle: string; summary: string; category: Exclude<Cat,'all'>; photoSrc: string; photoAlt: string; }

export default function BuildGallery({ items }: { items: Item[] }) {
  const [filter, setFilter] = useState<Cat>('all');
  const [open, setOpen] = useState<Item | null>(null);
  const filtered = useMemo(() => filter === 'all' ? items : items.filter(i => i.category === filter), [filter, items]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filter builds">
        {CATS.map(c => (
          <button key={c.id} role="tab" aria-selected={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={`px-4 py-2 font-display font-bold uppercase text-sm rounded transition-colors ${filter === c.id ? 'bg-[var(--color-ember)] text-[var(--color-paper)]' : 'border border-[var(--color-ink)]/25 text-[var(--color-ink)] hover:border-[var(--color-ember)]'}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(i => (
          <button key={i.id} onClick={() => setOpen(i)} className="group block text-left">
            <div className="aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-ink-2)]">
              <img src={i.photoSrc} alt={i.photoAlt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            </div>
            <h3 className="mt-3 text-lg font-display font-bold uppercase tracking-wide">{i.title}</h3>
            <p className="text-sm text-[var(--color-ink)]/75">{i.vehicle}</p>
          </button>
        ))}
      </div>
      <Lightbox open={!!open} src={open?.photoSrc ?? ''} alt={open?.photoAlt ?? ''} title={open?.title ?? ''} caption={`${open?.vehicle ?? ''} — ${open?.summary ?? ''}`} onClose={() => setOpen(null)} />
    </div>
  );
}
