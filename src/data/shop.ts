export const shop = {
  name: 'Pappytackle 4×4 & Auto',
  owner: 'Chance',
  address: {
    line1: '710 Sunset Pond Ln',
    city: 'Bellingham',
    state: 'WA',
    zip: '98226',
  },
  geo: { lat: 48.7951, lng: -122.4862 },
  phone: '3605436990',
  hours: [
    { day: 'Mon', open: '08:00', close: '17:00' },
    { day: 'Tue', open: '08:00', close: '17:00' },
    { day: 'Wed', open: '08:00', close: '17:00' },
    { day: 'Thu', open: '08:00', close: '17:00' },
    { day: 'Fri', open: '08:00', close: '17:00' },
    { day: 'Sat', open: null, close: null },
    { day: 'Sun', open: null, close: null },
  ],
  certifications: ['ASE Certified', 'BBB', 'NAPA', 'O’Reilly', 'Synchrony Car Care'],
  reviewStats: { average: 5.0, count: 36 },
} as const;
