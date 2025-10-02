import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export async function getCache(key: string) {
    return redis.get(key);
}

export async function setCache(key: string, value: string, ttlSeconds: number) {
    await redis.set(key, value, "EX", ttlSeconds)
}

export async function delCache(key: string) {
    await redis.del(key);
}
export function makeSummaryKey(userId: string, year: number, month: number) {
  const mm = String(month).padStart(2, "0");
  return `summary:${userId}:${year}-${mm}`;
}