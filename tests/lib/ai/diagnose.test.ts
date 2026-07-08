import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    content: [{ type: 'tool_use', name: 'return_diagnosis', input: {
      severity: 'schedule_visit',
      likely_causes: [{ label: 'Brake pads worn', plain_explanation: 'Common cause of squealing when braking.' }],
      safe_to_drive: 'unsure',
      suggested_service_category: 'brakes',
      next_step: 'have Chance take a look this week',
      disclaimer: 'best guess from limited info — defer to in-shop inspection',
    } }],
  });
  function MockAnthropic() {
    return { messages: { create: mockCreate } };
  }
  return { default: MockAnthropic };
});

const { diagnose } = await import('@/lib/ai/features/diagnose');

beforeEach(() => vi.clearAllMocks());

describe('diagnose', () => {
  it('returns a validated DiagnoseResult', async () => {
    const r = await diagnose({ symptom: 'squealing noise when I brake', vehicle: '2017 Tacoma' });
    expect(r.severity).toBe('schedule_visit');
    expect(r.suggested_service_category).toBe('brakes');
  });
  it('rejects too-short input', async () => {
    await expect(diagnose({ symptom: 'x' })).rejects.toThrow();
  });
});
