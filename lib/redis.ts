/**
 * Redis client for caching (using Upstash Redis - serverless, free tier available)
 * Used for caching synonym translations to reduce API calls
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client (will be null if env vars not set)
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn('Redis initialization failed:', error);
}

/**
 * Get cached value from Redis
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Set value in Redis cache with TTL (time to live in seconds)
 */
export async function setCache<T>(key: string, value: T, ttl: number = 86400): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.set(key, value, { ex: ttl });
  } catch (error) {
    console.error('Redis set error:', error);
  }
}

/**
 * Delete value from Redis cache
 */
export async function deleteCache(key: string): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Redis delete error:', error);
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}
