import { z } from 'zod';

export const ServiceCategoryZ = z.enum([
  'maintenance', 'diagnostics', 'hvac', 'electrical',
  'exhaust', 'brakes', 'oil_change', '4x4_custom',
]);

export const DiagnoseResultZ = z.object({
  severity: z.enum(['informational', 'schedule_visit', 'have_it_looked_at']),
  likely_causes: z.array(z.object({
    label: z.string().min(2),
    plain_explanation: z.string().min(10),
  })).min(1).max(4),
  safe_to_drive: z.union([z.boolean(), z.literal('unsure')]),
  suggested_service_category: ServiceCategoryZ.nullable(),
  next_step: z.string().min(10),
  disclaimer: z.string().min(10),
});
export type DiagnoseResult = z.infer<typeof DiagnoseResultZ>;

export const SuggestServiceResultZ = z.object({
  service_category: ServiceCategoryZ,
  rationale: z.string().min(5),
  confidence: z.enum(['high', 'medium', 'low']),
});
export type SuggestServiceResult = z.infer<typeof SuggestServiceResultZ>;

export const SearchResultItemZ = z.object({
  kind: z.enum(['service', 'recent_job']),
  id: z.string().min(1),
  title: z.string().min(1),
  score: z.number().min(0).max(1),
  reason: z.string().min(3),
  matchedTerms: z.array(z.string()),
});
export const SearchResultZ = z.object({
  results: z.array(SearchResultItemZ),
});
export type SearchResult = z.infer<typeof SearchResultItemZ>;

export const DiagnoseInputZ = z.object({
  symptom: z.string().min(3).max(2000),
  vehicle: z.string().max(200).optional(),
});
export const SuggestInputZ = z.object({
  description: z.string().min(3).max(2000),
});
export const SearchInputZ = z.object({
  query: z.string().min(2).max(200),
});
// Only user-authored turns are capped at 500 chars — assistant replies
// (sent back as history on the next request) can run longer than that.
const ChatMessageZ = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
}).superRefine((msg, ctx) => {
  if (msg.role === 'user' && msg.content.length > 500) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Message too long (max 500 characters).', path: ['content'] });
  }
});

export const ChatInputZ = z.object({
  messages: z.array(ChatMessageZ).min(1).max(40),
});
