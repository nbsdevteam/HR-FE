import { useId, useCallback, type DependencyList } from "react";
import { useQuery, type QueryKey } from "@tanstack/react-query";
import { DEFAULT_QUERY_STALE_TIME_MS } from "@/shared/api/queryClient";

type AsyncListOptions = {
  /**
   * Cache identity for this list — a stable resource name such as `"employees"`.
   * The effective query key appends the serialized `deps`, so a filtered variant of
   * a resource caches separately from the unfiltered one without the caller having
   * to spell that out. Two hooks resolving to the same key share one request:
   * concurrent mounts collapse onto a single fetch, and a mount within `ttlMs`
   * of the last one is served from cache instead of refetching.
   * Omit to keep the plain always-refetch-on-mount behaviour.
   */
  cacheKey?: string;
  /** How long cached data stays fresh. Defaults to `DEFAULT_QUERY_STALE_TIME_MS`. */
  ttlMs?: number;
  /** Skip fetching until true — e.g. a collapsed panel that only needs its data once expanded. Defaults to true. */
  enabled?: boolean;
  /**
   * Refetch when the tab regains focus even within `ttlMs`. Used for
   * "today" data (e.g. today's attendance) where staleness would mislead —
   * pair with `ttlMs: 0` so every mount/focus is treated as stale.
   */
  refetchOnWindowFocus?: boolean;
};

// Stable reference for the "no data yet" case — a fresh `[]` on every render
// would give callers a new array identity each time, which trips effects
// keyed on the returned `data` (e.g. `useEffect(() => sync(data), [data])`)
// into an infinite render loop while the query is still loading.
const EMPTY_LIST: unknown[] = [];

/**
 * Shared fetch-a-list-on-mount shape used across the app's Odoo-backed hooks:
 * loads `fetcher()` on mount/dep-change, tracks loading/error, exposes `refetch`.
 * Pass `pollMs` to also refetch on an interval. Pass `options.cacheKey` to share
 * one request (and its TanStack Query cache entry) with every other hook using
 * that key — see `queryClient.ts` for the app-wide cache this reads through.
 *
 * `loading` mirrors `isFetching` (not `isLoading`), matching the original
 * behaviour: it flips true on *every* fetch — including a forced `refetch()`
 * and each poll tick — not just the very first load.
 */
export const useAsyncList = <T,>(
  fetcher: () => Promise<T[]>,
  deps: DependencyList = [],
  errorFallback = "Failed to load data",
  pollMs?: number,
  options: AsyncListOptions = {}
) => {
  const {
    cacheKey,
    ttlMs = DEFAULT_QUERY_STALE_TIME_MS,
    enabled = true,
    refetchOnWindowFocus = false,
  } = options;

  // No cacheKey means "opt out of sharing" — give every hook instance its own
  // identity so it never collides with another mount of the same hook.
  const instanceId = useId();
  const queryKey: QueryKey = cacheKey ? [cacheKey, ...deps] : [instanceId, ...deps];

  const query = useQuery<T[], Error>({
    queryKey,
    queryFn: fetcher,
    enabled,
    staleTime: cacheKey ? ttlMs : 0,
    gcTime: cacheKey ? undefined : 0,
    refetchOnMount: cacheKey ? true : "always",
    refetchOnWindowFocus,
    refetchInterval: pollMs,
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query.refetch]);

  return {
    data: query.data ?? (EMPTY_LIST as T[]),
    loading: query.isFetching,
    error: query.error ? query.error.message || errorFallback : null,
    refetch,
  };
};
