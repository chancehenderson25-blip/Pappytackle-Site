import { useEffect } from 'react';

interface Props {
  open: boolean;
  src: string;
  alt: string;
  title: string;
  caption: string;
  onClose: () => void;
}

export default function Lightbox({ open, src, alt, title, caption, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 bg-black/90 grid place-items-center p-6" onClick={onClose}>
      <button aria-label="Close" onClick={onClose} className="absolute top-4 right-4 text-white p-2">✕</button>
      <figure className="max-w-6xl max-h-full" onClick={e => e.stopPropagation()}>
        <img src={src} alt={alt} className="max-h-[80vh] w-auto mx-auto rounded" />
        <figcaption className="mt-4 text-white text-center">
          <div className="font-display font-bold uppercase text-xl">{title}</div>
          <div className="text-sm text-white/80 mt-1">{caption}</div>
        </figcaption>
      </figure>
    </div>
  );
}
