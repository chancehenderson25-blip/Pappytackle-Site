import type { Review } from './types';

// All sample reviews — flip _isSample to false (or remove) after pasting real verbatim text.
export const reviews: Review[] = [
  { id: 'r1', rating: 5, name: 'Mark T.', date: '2026-03-14', _isSample: true,
    body: "Chance walked me through every part of the lift he put on my Tacoma. Honest, fair priced, and the work shows it. Won't take my truck anywhere else." },
  { id: 'r2', rating: 5, name: 'Sarah P.', date: '2026-02-02', _isSample: true,
    body: "Brought my van in for a weird noise the dealer couldn't figure out. Pappytackle had it diagnosed in an afternoon. Old-school service." },
  { id: 'r3', rating: 5, name: 'James R.', date: '2025-12-18', _isSample: true,
    body: 'Long-travel build on my Lexus GX came out exactly how I pictured it. Quality fab work, communication was great the whole time.' },
  { id: 'r4', rating: 5, name: 'Emily K.', date: '2025-11-04', _isSample: true,
    body: "Quick oil change, did a full vehicle look-over, told me my brakes had plenty of life left. A shop that doesn't try to upsell is rare." },
  { id: 'r5', rating: 5, name: 'David L.', date: '2025-10-22', _isSample: true,
    body: 'Did the diff service on my Gladiator and got me back on the road same week. Friendly local shop, supports the off-road community.' },
  { id: 'r6', rating: 5, name: 'Anna M.', date: '2025-09-30', _isSample: true,
    body: "My family has been using Pappytackle for everything from oil changes to a full Sienna lift. Chance is the real deal — knowledgeable, kind, fair." },
];
