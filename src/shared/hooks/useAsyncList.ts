import { useState, useRef, useCallback, useEffect, type DependencyList } from "react";
import {
  DEFAULT_CACHE_TTL_MS,
  fetchThroughCache,
  invalidateCache,
  isCacheFresh,
  readCache,
  setCacheError,
  subscribeToCache,
} from "./requestCache";

type AsyncListOptions = {
  /**
   * Cache identity for this list — a stable resource name such as `"employees"`.
   * The effective key appends the serialized `deps`, so a filtered variant of a
   * resource caches separately from the unfiltered one without the caller having
   * to spell that out. Two hooks resolving to the same key share one request:
   * concurrent mounts collapse onto a single fetch, and a mount within `ttlMs`
   * of the last one is served from cache instead of refetching.
   * Omit to keep the plain always-refetch-on-mount behaviour.
   */
  cacheKey?: string;
  /** How long cached data stays fresh. Defaults to `DEFAULT_CACHE_TTL_MS`. */
  ttlMs?: number;
};

/** Combine the resource name with its dep values into one cache identity. */
const buildCacheKey = (base: string | undefined, deps: DependencyList): string | undefined => {
  if (!base) return undefined;
  if (deps.length === 0) return base;
  try {
    return `${base}:${JSON.stringify(deps)}`;
  } catch {
    // A non-serializable dep means we cannot prove two callers match — skip caching.
    return undefined;
  }
};

/**
 * Shared fetch-a-list-on-mount shape used across the app's Odoo-backed hooks:
 * loads `fetcher()` on mount/dep-change, tracks loading/error, exposes `refetch`.
 * Pass `pollMs` to also refetch on an interval (cleared on unmount/dep change).
 * Pass `options.cacheKey` to share one request with every other hook using that
 * key — see `requestCache.ts` for why that matters on the dashboard.
 */
export const useAsyncList = <T,>(
  fetcher: () => Promise<T[]>,
  deps: DependencyList = [],
  errorFallback = "Failed to load data",
  pollMs?: number,
  options: AsyncListOptions = {}
) => {
  const { cacheKey: cacheKeyBase, ttlMs = DEFAULT_CACHE_TTL_MS } = options;
  const cacheKey = buildCacheKey(cacheKeyBase, deps);
  const cached = cacheKey ? readCache<T>(cacheKey) : undefined;
  const servedFromCache = Boolean(cacheKey && isCacheFresh(cacheKey, ttlMs));

  const [data, setData] = useState<T[]>(cached?.data ?? []);
  const [loading, setLoading] = useState(!servedFromCache);
  const [error, setError] = useState<string | null>(cached?.error ?? null);

  // Keep the latest fetcher in a ref so `fetchData` stays referentially stable
  // (it is handed to consumers as `refetch` and lands in their dep arrays).
  const fetcherRef = useRef(fetcher);
  const mountedRef = useRef(true);

  fetcherRef.current = fetcher;

  const runFetch = useCallback(
    async (force: boolean) => {
      if (cacheKey && !force && isCacheFresh(cacheKey, ttlMs)) {
        const hit = readCache<T>(cacheKey);
        if (hit) {
          setData(hit.data);
          setError(hit.error);
          setLoading(false);
          return;
        }
      }
      if (cacheKey && force) invalidateCache(cacheKey);

      setLoading(true);
      try {
        const result = cacheKey
          ? await fetchThroughCache<T>(cacheKey, () => fetcherRef.current())
          : await fetcherRef.current();
        if (!mountedRef.current) return;
        setData(result);
        setError(null);
      } catch (e: any) {
        console.error(e);
        const message = e?.message || errorFallback;
        if (cacheKey) setCacheError(cacheKey, message);
        if (!mountedRef.current) return;
        setError(message);
        setData([]);
      }
      if (mountedRef.current) setLoading(false);
    },
    [cacheKey, ttlMs, errorFallback]
  );

  const refetch = useCallback(() => runFetch(true), [runFetch]);

  // Re-render this consumer when another hook sharing the key refreshes the data.
  useEffect(() => {
    if (!cacheKey) return;
    return subscribeToCache(cacheKey, () => {
      const hit = readCache<T>(cacheKey);
      if (!hit || !mountedRef.current) return;
      setData(hit.data);
      setError(hit.error);
      setLoading(false);
    });
  }, [cacheKey]);

  useEffect(() => {
    mountedRef.current = true;
    runFetch(false);
    if (!pollMs) return () => { mountedRef.current = false; };
    const interval = setInterval(() => runFetch(true), pollMs);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch };
};
