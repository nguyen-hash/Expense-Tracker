import Redis from "ioredis";

export const cache = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export async function getCache(key: string) {
    return cache.get(key);
}

export async function setCache(key: string, value: string, ttlSeconds: number) {
    await cache.set(key, value, "EX", ttlSeconds)
}

export async function delCache(key: string) {
    await cache.del(key);
}
export function makeSummaryKey(userId: string, year: number, month: number) {
  const mm = String(month).padStart(2, "0");
  return `summary:${userId}:${year}-${mm}`;
}