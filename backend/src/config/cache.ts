// src/config/cache.ts
import NodeCache from "node-cache";
 
const cache = new NodeCache();
 
export function getCache<T = any>(key: string): T | undefined {
  return cache.get<T>(key);
}
 
export function setCache<T = any>(key: string, data: T, ttlSeconds: number): boolean {
  return cache.set(key, data, ttlSeconds);
}
 
export function deleteCache(key: string): number {
  return cache.del(key);
}
 
/**
 * Delete all keys matching a prefix.
 * Useful for invalidating dynamic keys like `listings:reviews:<id>:*`
 */
export function deleteCacheByPrefix(prefix: string): void {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length) cache.del(keys);
}
 
export function flushCache(): void {
  cache.flushAll();
}
 
export default cache;