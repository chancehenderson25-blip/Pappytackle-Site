import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    content: [{
      type: 'tool_use',
      name: 'return_search_results',
      input: {
        results: [{
          kind: 'service',
          id: 'brakes',
          title: 'Brakes',
          score: 0.95,
          reason: 'direct match',
          matchedTerms: ['brake'],
        }],
      },
    }],
  });
  function MockAnthropic() {
    return { messages: { create: mockCreate } };
  }
  return { default: MockAnthropic };
});

const { search } = await import('@/lib/ai/features/search');

beforeEach(() => vi.clearAllMocks());

describe('search', () => {
  it('returns results with first result id === brakes for query "brake"', async () => {
    const r = await search({ query: 'brake' });
    expect(r.results[0].id).toBe('brakes');
  });

  it('rejects too-short query', async () => {
    await expect(search({ query: 'x' })).rejects.toThrow();
  });
});
