import { anthropic, MODELS, withRetry } from '../client';
import { SHOP_SYSTEM } from '../shopContext';
import { SuggestInputZ, SuggestServiceResultZ, type SuggestServiceResult } from '../schemas';

const TOOL = {
  name: 'return_suggestion',
  description: 'Map a customer description to a service category we offer.',
  input_schema: {
    type: 'object',
    properties: {
      service_category: { type: 'string', enum: ['maintenance','diagnostics','hvac','electrical','exhaust','brakes','oil_change','4x4_custom'] },
      rationale: { type: 'string' },
      confidence: { type: 'string', enum: ['high','medium','low'] },
    },
    required: ['service_category', 'rationale', 'confidence'],
  },
} as const;

export async function suggestService(input: unknown): Promise<SuggestServiceResult> {
  const { description } = SuggestInputZ.parse(input);
  const resp = await withRetry(() => anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 300,
    tools: [TOOL as any],
    tool_choice: { type: 'tool', name: 'return_suggestion' },
    system: [{ type: 'text', text: SHOP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: `Customer description:\n${description}` }],
  }));
  const block = resp.content.find((b: any) => b.type === 'tool_use') as any;
  if (!block) throw new Error('No tool_use block');
  return SuggestServiceResultZ.parse(block.input);
}
