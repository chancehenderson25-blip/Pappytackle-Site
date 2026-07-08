import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };
const STARTERS = [
  'Do you work on Jeeps?',
  'What does a 3-inch lift on a Tacoma run?',
  'Is the noise I\'m hearing serious?',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [msgs]);

  async function send(text: string) {
    const userMsg: Msg = { role: 'user', content: text };
    const history = [...msgs, userMsg];
    setMsgs([...history, { role: 'assistant', content: '' }]);
    setInput(''); setStreaming(true);

    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history }), signal: ctrl.signal,
      });
      if (!res.body) throw new Error('no body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n\n'); buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.delta) {
              setMsgs(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content + evt.delta };
                return next;
              });
            } else if (evt.error) {
              setMsgs(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: evt.error };
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setMsgs(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: "Sorry — assistant unavailable. Call (360) 543-6990." };
          return next;
        });
      }
    } finally { setStreaming(false); abortRef.current = null; }
  }

  return (
    <>
      <button aria-label="Open chat" onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-[var(--color-ember)] text-[var(--color-paper)] shadow-lg hover:bg-[var(--color-ember-dark)] grid place-items-center transition-transform hover:scale-105 ${open ? 'opacity-0 pointer-events-none' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Ask Pappytackle"
          className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[440px] md:max-h-[640px] md:rounded-[var(--radius-card)] z-40 bg-[var(--color-ink)] text-[var(--color-paper)] flex flex-col shadow-2xl overflow-hidden">
          <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-bone)]/15">
            <div>
              <p className="font-display font-bold uppercase tracking-wide">Ask Pappytackle</p>
              <p className="text-xs text-[var(--color-bone)]/60">We usually reply in seconds. For urgent things, call (360) 543-6990.</p>
            </div>
            <button aria-label="Close" onClick={() => setOpen(false)} className="p-2 text-[var(--color-bone)]/80 hover:text-[var(--color-paper)]">✕</button>
          </header>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {msgs.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-bone)]/80">Hey — what can we help with?</p>
                <div className="flex flex-col gap-2">
                  {STARTERS.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-left text-sm px-3 py-2 border border-[var(--color-bone)]/20 rounded hover:bg-[var(--color-ink-2)]">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-[var(--color-ember)] text-[var(--color-paper)]' : 'bg-[var(--color-ink-2)] text-[var(--color-bone)]'}`}>
                  {m.content || (streaming && i === msgs.length - 1 ? '…' : '')}
                </div>
              </div>
            ))}
          </div>
          <form className="border-t border-[var(--color-bone)]/15 p-3 flex gap-2" onSubmit={e => { e.preventDefault(); if (input.trim() && !streaming) send(input.trim()); }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a question…"
              className="flex-1 px-3 py-2 bg-[var(--color-ink-2)] border border-[var(--color-bone)]/15 rounded text-[var(--color-paper)] focus:border-[var(--color-gold)] focus:outline-none" />
            <button type="submit" disabled={streaming || !input.trim()}
              className="px-3 py-2 bg-[var(--color-ember)] rounded disabled:opacity-50">→</button>
          </form>
        </div>
      )}
    </>
  );
}
