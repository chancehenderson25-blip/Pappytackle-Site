import { anthropic, MODELS, withRetry } from '../client';
import { SHOP_SYSTEM } from '../shopContext';
import { DiagnoseInputZ, DiagnoseResultZ, type DiagnoseResult } from '../schemas';

const TOOL = {
  name: 'return_diagnosis',
  description: 'Return a structured diagnosis. Always non-alarmist, always defers to in-shop inspection.',
  input_schema: {
    type: 'object',
    properties: {
      severity: { type: 'string', enum: ['informational', 'schedule_visit', 'have_it_looked_at'] },
      likely_causes: {
        type: 'array', minItems: 1, maxItems: 4,
        items: {
          type: 'object',
          properties: { label: { type: 'string' }, plain_explanation: { type: 'string' } },
          required: ['label', 'plain_explanation'],
        },
      },
      safe_to_drive: { oneOf: [{ type: 'boolean' }, { type: 'string', enum: ['unsure'] }] },
      suggested_service_category: { type: ['string', 'null'], enum: ['maintenance','diagnostics','hvac','electrical','exhaust','brakes','oil_change','4x4_custom', null] },
      next_step: { type: 'string' },
      disclaimer: { type: 'string' },
    },
    required: ['severity', 'likely_causes', 'safe_to_drive', 'suggested_service_category', 'next_step', 'disclaimer'],
  },
} as const;

export async function diagnose(input: unknown): Promise<DiagnoseResult> {
  const { symptom, vehicle } = DiagnoseInputZ.parse(input);
  const userMessage = vehicle
    ? `Vehicle: ${vehicle}\nSymptom: ${symptom}`
    : `Symptom: ${symptom}`;

  const resp = await withRetry(() => anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 800,
    tools: [TOOL as any],
    tool_choice: { type: 'tool', name: 'return_diagnosis' },
    system: [{ type: 'text', text: SHOP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  }));

  const block = resp.content.find((b: any) => b.type === 'tool_use') as any;
  if (!block) throw new Error('No tool_use block in diagnose response');
  return DiagnoseResultZ.parse(block.input);
}
