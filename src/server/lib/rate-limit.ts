/**
 * Lightweight fixed-window rate limiter.
 *
 * Default backend is an in-process Map — fine for a single instance / personal
 * use, best-effort on multi-instance serverless. For production multi-instance,
 * swap `check()` for @upstash/ratelimit (Redis) — same signature.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of store) if (b.resetAt <= now) store.delete(key);
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + opts.windowMs };
    store.set(key, bucket);
    return { ok: true, remaining: opts.limit - 1, resetAt: bucket.resetAt };
  }

  existing.count += 1;
  const ok = existing.count <= opts.limit;
  return {
    ok,
    remaining: Math.max(0, opts.limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Common presets. */
export const RATE_LIMITS = {
  mutation: { limit: 60, windowMs: 60_000 }, // 60 writes / min / user
  search: { limit: 30, windowMs: 60_000 },
  export: { limit: 5, windowMs: 60_000 },
} as const;
