import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const url = import.meta.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

if (!redis) {
  console.warn('[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN not set — AI endpoints are unthrottled.');
}

// One shared limiter: 20 requests/hour per IP across all AI endpoints combined.
const limiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 h'), prefix: 'pappytackle:ai' })
  : null;

export async function checkRateLimit(ip: string): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  if (!limiter) return { ok: true };
  const { success, reset } = await limiter.limit(ip);
  if (success) return { ok: true };
  return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
}

export function clientIp(request: Request, clientAddress?: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return clientAddress || 'unknown';
}
