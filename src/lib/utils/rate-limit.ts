import { env } from "@/lib/env";

/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Suitable as an architectural placeholder. For production at scale, swap the
 * underlying store for Redis/Upstash without changing the public API.
 */

interface Bucket {
  count: number;
  reset: number;
}

const store = new Map<string, Bucket>();

export interface RateLimitOptions {
  key: string;
  max?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

export function rateLimit(opts: RateLimitOptions): RateLimitResult {
  const max = opts.max ?? env.RATE_LIMIT_MAX;
  const windowMs = opts.windowMs ?? env.RATE_LIMIT_WINDOW_MS;
  const now = Date.now();

  const current = store.get(opts.key);
  if (!current || current.reset <= now) {
    const reset = now + windowMs;
    store.set(opts.key, { count: 1, reset });
    return { allowed: true, remaining: max - 1, reset };
  }

  if (current.count >= max) {
    return { allowed: false, remaining: 0, reset: current.reset };
  }

  current.count += 1;
  return { allowed: true, remaining: max - current.count, reset: current.reset };
}

export function clientIpFromHeaders(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "unknown";
}
