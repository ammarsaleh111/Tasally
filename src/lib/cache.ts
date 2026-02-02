/**
 * Serverless-Optimized Cache
 * 
 * Multi-tier caching strategy:
 * 1. In-memory cache (per-instance, best effort)
 * 2. HTTP cache headers for CDN/edge caching
 * 
 * For serverless, we prioritize HTTP caching over in-memory.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

// In-memory cache (per serverless instance - best effort only)
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Max cache entries to prevent memory bloat
const MAX_CACHE_ENTRIES = 100;

/**
 * Get item from cache if not expired
 */
export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  
  if (!entry) {
    return null;
  }
  
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Set item in cache with TTL
 */
export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  // Evict oldest entries if cache is full
  if (memoryCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = findOldestEntry();
    if (oldestKey) {
      memoryCache.delete(oldestKey);
    }
  }
  
  const now = Date.now();
  memoryCache.set(key, {
    data,
    expiresAt: now + ttlSeconds * 1000,
    createdAt: now,
  });
}

/**
 * Invalidate cache entry
 */
export function invalidateCache(key: string): void {
  memoryCache.delete(key);
}

/**
 * Invalidate all entries matching a prefix
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Find oldest cache entry
 */
function findOldestEntry(): string | null {
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.createdAt < oldestTime) {
      oldestTime = entry.createdAt;
      oldestKey = key;
    }
  }
  
  return oldestKey;
}

/**
 * Build cache key for leaderboard
 */
export function leaderboardCacheKey(
  type: 'daily' | 'monthly',
  game: string,
  dateKey: string
): string {
  return `leaderboard:${type}:${game}:${dateKey}`;
}

/**
 * Cache durations (in seconds)
 */
export const CACHE_DURATIONS = {
  LEADERBOARD_DAILY: 30,   // 30 seconds for daily (more dynamic)
  LEADERBOARD_MONTHLY: 60, // 60 seconds for monthly (less dynamic)
  THEME_SETTINGS: 300,     // 5 minutes for theme settings
} as const;

/**
 * Get-or-fetch pattern with caching
 */
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  const data = await fetcher();
  setCache(key, data, ttlSeconds);
  return data;
}

/**
 * Cleanup expired entries (call periodically)
 */
export function cleanupCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now > entry.expiresAt) {
      memoryCache.delete(key);
    }
  }
}
