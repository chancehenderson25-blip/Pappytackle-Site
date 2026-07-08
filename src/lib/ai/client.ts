import Anthropic from '@anthropic-ai/sdk';

export const MODELS = {
  fast: 'claude-haiku-4-5',
  chat: 'claude-sonnet-4-6',
} as const;

const apiKey = import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn('[ai/client] ANTHROPIC_API_KEY not set — AI features will fail at request time.');
}
export const anthropic = new Anthropic({ apiKey: apiKey ?? 'missing' });

export async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err: any) {
      lastErr = err;
      const status = err?.status ?? err?.response?.status;
      const retriable = status === 429 || (status >= 500 && status < 600);
      if (!retriable || i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}
