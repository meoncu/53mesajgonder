// Shared cache utility for contacts
// This uses the global object to persist across serverless function re-uses in Next.js

const CACHE_KEY = '__CONTACTS_CACHE__';
const TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  items: any[];
  timestamp: number;
}

export function getCachedContacts(): any[] | null {
  const cache = (global as any)[CACHE_KEY] as CacheEntry | undefined;
  if (cache && (Date.now() - cache.timestamp < TTL)) {
    return cache.items;
  }
  return null;
}

export function setCachedContacts(items: any[]) {
  (global as any)[CACHE_KEY] = {
    items,
    timestamp: Date.now()
  };
}

export function invalidateContactsCache() {
  delete (global as any)[CACHE_KEY];
}
