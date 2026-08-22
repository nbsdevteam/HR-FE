import { useState, useEffect, type DependencyList } from "react";

/**
 * Shared fetch-a-list-on-mount shape used across the app's Odoo-backed hooks:
 * loads `fetcher()` on mount/dep-change, tracks loading/error, exposes `refetch`.
 * Pass `pollMs` to also refetch on an interval (cleared on unmount/dep change).
 */
export const useAsyncList = <T,>(
  fetcher: () => Promise<T[]>,
  deps: DependencyList = [],
  errorFallback = "Failed to load data",
  pollMs?: number
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      setData(await fetcher());
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || errorFallback);
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    if (!pollMs) return;
    const interval = setInterval(fetchData, pollMs);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: fetchData };
};
