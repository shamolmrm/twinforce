import Redis from "ioredis";
import { logger } from "./logger.ts";

let _redisInstance: Redis;

export function getRedis(): Redis {
  if (!_redisInstance) {
    _redisInstance = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      reconnectOnError: (err) => {
        logger.error({ err }, "Redis reconnect on error");
        return true;
      },
    });
    _redisInstance.on("error", (err) => logger.error({ err }, "Redis error"));
    _redisInstance.on("connect", () => logger.info("Redis connected"));
  }
  return _redisInstance;
}

export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    return (getRedis() as any)[prop];
  },
});

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await getRedis().get(key);
  return raw ? (JSON.parse(raw) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  await getRedis().del(key);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  const r = getRedis();
  const keys = await r.keys(pattern);
  if (keys.length > 0) await r.del(...keys);
}
