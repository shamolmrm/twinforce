import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { getRedis } from "../lib/redis.ts";

interface RateLimitOptions {
  windowMs?: number;   // default 60_000 (1 min)
  max?: number;        // default 100 per window
  keyFn?: (c: Context) => string;
}

export function rateLimit(opts: RateLimitOptions = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const max = opts.max ?? 100;
  const windowSec = Math.ceil(windowMs / 1000);

  return createMiddleware(async (c: Context, next: Next) => {
    const user = c.get("user");
    const ip = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "unknown";
    const key = opts.keyFn
      ? opts.keyFn(c)
      : user
        ? `rl:user:${user.userId}`
        : `rl:ip:${ip}`;

    const redis = getRedis();
    const current = await redis.incr(key);
    if (current === 1) await redis.expire(key, windowSec);

    const ttl = await redis.ttl(key);
    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - current)));
    c.header("X-RateLimit-Reset", String(Date.now() + ttl * 1000));

    if (current > max) {
      throw new HTTPException(429, { message: "Too many requests. Please slow down." });
    }
    return next();
  });
}

// Stricter limit for auth endpoints
export const authRateLimit = rateLimit({ max: 10, windowMs: 60_000 });
// Standard API limit
export const apiRateLimit = rateLimit({ max: 100, windowMs: 60_000 });
// AI endpoints are expensive
export const aiRateLimit = rateLimit({ max: 20, windowMs: 60_000 });
