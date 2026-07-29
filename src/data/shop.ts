export const shop = {
  name: 'Pappytackle 4×4 & Auto',
  owner: 'Chance',
  address: {
    line1: '230 Birch Bay Lynden Rd',
    city: 'Lynden',
    state: 'WA',
    zip: '98264',
  },
  phone: '3605436990',
  hours: [
    { day: 'Mon', open: '09:30', close: '18:30' },
    { day: 'Tue', open: '09:30', close: '18:30' },
    { day: 'Wed', open: '09:30', close: '18:30' },
    { day: 'Thu', open: '09:30', close: '18:30' },
    { day: 'Fri', open: '09:30', close: '18:30' },
    { day: 'Sat', open: null, close: null, note: 'By request' },
    { day: 'Sun', open: null, close: null, note: 'By request' },
  ],
  certifications: ['ASE Certified', 'BBB', 'NAPA', "O'Reilly", 'Synchrony Car Care'],
  // Counted from the 2026-07-28 Google Business Profile screenshots (57 visible,
  // all 5-star). Worth re-checking against the live profile before treating the
  // count as exact — it feeds the JSON-LD aggregateRating Google reads.
  reviewStats: { average: 5.0, count: 57 },
} as const;
