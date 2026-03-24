// Shared cache utility for contacts and groups
// This uses the global object to persist across serverless function re-uses in Next.js

const CONTACTS_CACHE_KEY = '__CONTACTS_CACHE__';
const GROUPS_CACHE_KEY = '__GROUPS_CACHE__';
const TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  items: any[];
  timestamp: number;
}

// Contacts Cache
export function getCachedContacts(): any[] | null {
  const cache = (global as any)[CONTACTS_CACHE_KEY] as CacheEntry | undefined;
  if (cache && (Date.now() - cache.timestamp < TTL)) {
    return cache.items;
  }
  return null;
}

export function setCachedContacts(items: any[]) {
  (global as any)[CONTACTS_CACHE_KEY] = {
    items,
    timestamp: Date.now()
  };
}

export function invalidateContactsCache() {
  delete (global as any)[CONTACTS_CACHE_KEY];
}

// Groups Cache
export function getCachedGroups(): any[] | null {
  const cache = (global as any)[GROUPS_CACHE_KEY] as CacheEntry | undefined;
  if (cache && (Date.now() - cache.timestamp < TTL)) {
    return cache.items;
  }
  return null;
}

export function setCachedGroups(items: any[]) {
  (global as any)[GROUPS_CACHE_KEY] = {
    items,
    timestamp: Date.now()
  };
}

export function invalidateGroupsCache() {
  delete (global as any)[GROUPS_CACHE_KEY];
}
