import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: 'tool_use', name: 'return_suggestion', input: {
      service_category: '4x4_custom',
      rationale: 'lift install',
      confidence: 'high',
    } }],
  });
  function MockAnthropic() {
    return { messages: { create: mockCreate } };
  }
  return { default: MockAnthropic };
});

const { suggestService } = await import('@/lib/ai/features/suggestService');

beforeEach(() => vi.clearAllMocks());

describe('suggestService', () => {
  it('returns service_category and confidence for lift description', async () => {
    const r = await suggestService({ description: 'I want a 3 inch lift on my Tacoma' });
    expect(r.service_category).toBe('4x4_custom');
    expect(r.confidence).toBe('high');
  });
});
