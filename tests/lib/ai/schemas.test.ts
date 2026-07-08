import { describe, it, expect } from 'vitest';
import { DiagnoseResultZ, SearchResultZ } from '@/lib/ai/schemas';

describe('DiagnoseResultZ', () => {
  it('rejects empty causes', () => {
    expect(() => DiagnoseResultZ.parse({
      severity: 'informational',
      likely_causes: [],
      safe_to_drive: true,
      suggested_service_category: null,
      next_step: 'stop by if it gets worse',
      disclaimer: 'always defer to in-shop inspection',
    })).toThrow();
  });
  it('accepts a well-formed result', () => {
    const ok = DiagnoseResultZ.parse({
      severity: 'schedule_visit',
      likely_causes: [{ label: 'Worn brake pads', plain_explanation: 'Most likely the pads are at the end of their life.' }],
      safe_to_drive: 'unsure',
      suggested_service_category: 'brakes',
      next_step: 'have Chance take a look this week',
      disclaimer: 'this is a best guess from limited info',
    });
    expect(ok.severity).toBe('schedule_visit');
  });
});

describe('SearchResultZ', () => {
  it('parses results array', () => {
    const ok = SearchResultZ.parse({ results: [
      { kind: 'service', id: 'brakes', title: 'Brakes', score: 0.9, reason: 'direct match', matchedTerms: ['brake'] },
    ] });
    expect(ok.results).toHaveLength(1);
  });
});
