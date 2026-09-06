import { QueryClient } from "@tanstack/react-query";

/**
 * Matches the old `requestCache.ts` default TTL so the migration to
 * TanStack Query does not change how long a list stays fresh by default.
 */
export const DEFAULT_QUERY_STALE_TIME_MS = 60_000;

/**
 * Named stale-time tiers so a hook's freshness intent is legible at the call
 * site instead of a bare number. Pick the tier by how the *displayed* data
 * behaves, not by which table it comes from:
 * - `REALTIME`: must never show a lag — "who's here right now" style views.
 *   Always pair with `refetchOnWindowFocus: true`, since a 0 staleTime alone
 *   only forces a refetch on mount, not when the tab regains focus.
 * - `SHORT`: an actionable queue (new items should surface promptly) or a
 *   calendar view scoped to the current day/week — pair with
 *   `refetchOnWindowFocus: true` for the same reason as above.
 * - `DEFAULT`: the app-wide default (`staleTime` on `queryClient` below) —
 *   moderate-churn lists that don't need a named override.
 * - `LONG`: admin-managed reference/catalog data that only changes through a
 *   form covered by `useOdooMutation`, which invalidates its cache key on
 *   save — safe to leave stale far longer since an edit still busts it
 *   immediately regardless of this TTL.
 */
export const STALE_TIME = {
  REALTIME: 0,
  SHORT: 15_000,
  DEFAULT: DEFAULT_QUERY_STALE_TIME_MS,
  LONG: 10 * 60_000,
} as const;

/** How long an unused query stays in memory before garbage collection. */
const DEFAULT_QUERY_GC_TIME_MS = 5 * 60_000;

/**
 * Single app-wide cache, replacing the old `requestCache.ts` Map. Every
 * Odoo-backed hook reads/writes through this client (see `useAsyncList.ts`).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_QUERY_STALE_TIME_MS,
      gcTime: DEFAULT_QUERY_GC_TIME_MS,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
