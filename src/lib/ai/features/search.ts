import { anthropic, MODELS, withRetry } from '../client';
import { SHOP_SYSTEM } from '../shopContext';
import { SearchInputZ, SearchResultZ } from '../schemas';
import { services } from '@/data/services';
import { recentJobs } from '@/data/recentJobs';

const TOOL = {
  name: 'return_search_results',
  description: 'Return ranked search results across shop services and recent jobs.',
  input_schema: {
    type: 'object',
    properties: {
      results: {
        type: 'array', maxItems: 8,
        items: {
          type: 'object',
          properties: {
            kind: { type: 'string', enum: ['service', 'recent_job'] },
            id: { type: 'string' },
            title: { type: 'string' },
            score: { type: 'number', minimum: 0, maximum: 1 },
            reason: { type: 'string' },
            matchedTerms: { type: 'array', items: { type: 'string' } },
          },
          required: ['kind','id','title','score','reason','matchedTerms'],
        },
      },
    },
    required: ['results'],
  },
} as const;

export async function search(input: unknown) {
  const { query } = SearchInputZ.parse(input);
  const catalog = JSON.stringify({
    services: services.map(s => ({ id: s.id, title: s.name, summary: s.summary })),
    recent_jobs: recentJobs.map(j => ({ id: j.id, title: `${j.vehicle} — ${j.work}` })),
  });
  const resp = await withRetry(() => anthropic.messages.create({
    model: MODELS.fast,
    max_tokens: 800,
    tools: [TOOL as any],
    tool_choice: { type: 'tool', name: 'return_search_results' },
    system: [{ type: 'text', text: SHOP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{
      role: 'user',
      content: `Query: ${query}\n\nRank entries from this catalog by relevance. Only include entries that genuinely match; empty array is fine.\n\nCatalog:\n${catalog}`,
    }],
  }));
  const block = resp.content.find((b: any) => b.type === 'tool_use') as any;
  if (!block) throw new Error('No tool_use block');
  return SearchResultZ.parse(block.input);
}
