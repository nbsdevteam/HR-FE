import { QueryClient } from "@tanstack/react-query";

/**
 * Matches the old `requestCache.ts` default TTL so the migration to
 * TanStack Query does not change how long a list stays fresh by default.
 */
export const DEFAULT_QUERY_STALE_TIME_MS = 60_000;

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
