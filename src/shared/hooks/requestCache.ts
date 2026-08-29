/**
 * Tiny request cache + in-flight de-duplicator backing `useAsyncList`.
 *
 * Every Odoo-backed list hook in the app funnels through `useAsyncList`, so
 * caching here fixes two whole classes of waste at once:
 *  - the dashboard mounting ~22 independent hooks and firing ~22 requests on
 *    every visit, then re-firing all of them on the next visit;
 *  - sibling components on one page (e.g. the attendance table and the shift
 *    assigner) each calling `useEmployees()` and fetching the same roster twice.
 *
 * Entries are keyed by a caller-supplied string. Hooks without a key opt out
 * entirely and keep the previous always-refetch behaviour.
 */

/** How long a cached list stays fresh before the next mount refetches it. */
export const DEFAULT_CACHE_TTL_MS = 60_000;

type CacheEntry = {
  data: unknown[];
  error: string | null;
  /** `null` once a fetch has settled; a live promise while one is in flight. */
  promise: Promise<unknown[]> | null;
  fetchedAt: number;
  subscribers: Set<() => void>;
};

const cache = new Map<string, CacheEntry>();

const getEntry = (key: string): CacheEntry => {
  let entry = cache.get(key);
  if (!entry) {
    entry = { data: [], error: null, promise: null, fetchedAt: 0, subscribers: new Set() };
    cache.set(key, entry);
  }
  return entry;
};

const notify = (entry: CacheEntry): void => {
  entry.subscribers.forEach((listener) => listener());
};

/** Subscribe to changes for `key`; returns an unsubscribe function. */
export const subscribeToCache = (key: string, listener: () => void): (() => void) => {
  const entry = getEntry(key);
  entry.subscribers.add(listener);
  return () => {
    entry.subscribers.delete(listener);
  };
};

/** Current cached value for `key`, or undefined when nothing is cached yet. */
export const readCache = <T,>(key: string): { data: T[]; error: string | null } | undefined => {
  const entry = cache.get(key);
  if (!entry || entry.fetchedAt === 0) return undefined;
  return { data: entry.data as T[], error: entry.error };
};

/** True when `key` holds a value young enough to serve without refetching. */
export const isCacheFresh = (key: string, ttlMs: number): boolean => {
  const entry = cache.get(key);
  if (!entry || entry.fetchedAt === 0) return false;
  return Date.now() - entry.fetchedAt < ttlMs;
};

/**
 * Run `fetcher` for `key`, collapsing concurrent callers onto one request.
 * A second component asking for the same key while a request is in flight
 * awaits the same promise instead of issuing its own.
 */
export const fetchThroughCache = async <T,>(
  key: string,
  fetcher: () => Promise<T[]>,
): Promise<T[]> => {
  const entry = getEntry(key);
  if (entry.promise) return entry.promise as Promise<T[]>;

  const promise = fetcher()
    .then((result) => {
      entry.data = result;
      entry.error = null;
      entry.fetchedAt = Date.now();
      entry.promise = null;
      notify(entry);
      return result;
    })
    .catch((cause) => {
      entry.promise = null;
      throw cause;
    });

  entry.promise = promise as Promise<unknown[]>;
  return promise;
};

/** Record a failed fetch so every subscriber to `key` sees the same error. */
export const setCacheError = (key: string, message: string): void => {
  const entry = getEntry(key);
  entry.data = [];
  entry.error = message;
  entry.fetchedAt = Date.now();
  notify(entry);
};

/**
 * Drop cached data so the next read refetches. Pass a key to invalidate one
 * entry, or a prefix match via `invalidateCachePrefix` for a whole family.
 */
export const invalidateCache = (key: string): void => {
  const entry = cache.get(key);
  if (!entry) return;
  entry.fetchedAt = 0;
  entry.promise = null;
};

/** Invalidate every cached key beginning with `prefix` (e.g. all leave lists). */
export const invalidateCachePrefix = (prefix: string): void => {
  cache.forEach((entry, key) => {
    if (!key.startsWith(prefix)) return;
    entry.fetchedAt = 0;
    entry.promise = null;
  });
};

/** Wipe everything — used on logout so the next session never sees stale rows. */
export const clearCache = (): void => {
  cache.clear();
};
