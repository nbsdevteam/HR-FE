import { useCallback, useEffect, useState } from "react";
import { fetchHrRoles, type HrRoleListItem } from "../api/permissionsAdmin";

/**
 * Directory (search/list) state for the Job Roles tab. `enabled` defers the
 * fetch until that tab is actually selected, mirroring `useHrPermissionsAdmin`.
 */
export const useHrRolesAdmin = (enabled: boolean) => {
  const [items, setItems] = useState<HrRoleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const fetchRoles = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await fetchHrRoles({ search, active: true });
      setItems(data.items);
      setTotal(data.total);
      setForbidden(false);
    } catch {
      setItems([]);
      setTotal(0);
      setForbidden(true);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!enabled) return;
    fetchRoles();
  }, [enabled, fetchRoles]);

  return {
    items,
    total,
    search,
    setSearch,
    loading,
    forbidden,
    refetch: fetchRoles,
  };
};
