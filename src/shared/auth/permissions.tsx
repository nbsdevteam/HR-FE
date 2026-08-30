import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchMyPermissions, type HrPermissionsResponse } from "@/shared/api/permissions";
import { useAuth } from "./index";

interface PermissionsContextType {
  role: string | null;
  loading: boolean;
  hasPermission: (path: string) => boolean;
  canSeeRoute: (routeKey: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  role: null,
  loading: true,
  hasPermission: () => false,
  canSeeRoute: () => false,
});

export const usePermissions = (): PermissionsContextType => useContext(PermissionsContext);

const readPath = (tree: Record<string, unknown> | undefined, path: string): boolean => {
  if (!tree) return false;
  const segments = path.split(".");
  let node: unknown = tree;
  for (const segment of segments) {
    if (!node || typeof node !== "object") return false;
    node = (node as Record<string, unknown>)[segment];
  }
  return node === true;
};

/**
 * Sibling to `AuthProvider`, not a part of it — session/login logic stays
 * independent of permission-fetch logic. Mounted only around the
 * authenticated router, so it fetches once per login rather than once per
 * navigation.
 */
const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<HrPermissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const hasPermission = useCallback(
    (path: string): boolean => readPath(data?.permissions, path),
    [data],
  );

  const canSeeRoute = useCallback(
    (routeKey: string): boolean => Boolean(data?.routes[routeKey]),
    [data],
  );

  // Declared after the useCallbacks above (not before, per the usual
  // useMemo-then-useCallback ordering) because it closes over them directly —
  // same deviation as `AuthProvider`'s own context-value memo.
  const value = useMemo<PermissionsContextType>(
    () => ({ role: data?.role ?? null, loading, hasPermission, canSeeRoute }),
    [data, loading, hasPermission, canSeeRoute],
  );

  useEffect(() => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchMyPermissions()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

export default PermissionsProvider;
