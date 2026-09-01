import { useCallback, useEffect, useState } from "react";
import {
  fetchHrAdminUsers,
  fetchHrPermissionsSchema,
  type HrAdminUserListItem,
  type HrPermissionsSchema,
} from "../api/permissionsAdmin";

/**
 * Directory (search/filter/list) + schema state for the Roles & Permissions
 * card. `enabled` defers both fetches until the card's dialog is actually
 * opened, so having `hr.roles_permissions.view` doesn't cost an API call on
 * every Settings page load.
 */
export const useHrPermissionsAdmin = (enabled: boolean) => {
  const [schema, setSchema] = useState<HrPermissionsSchema | null>(null);
  const [items, setItems] = useState<HrAdminUserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchSchema = useCallback(async (): Promise<void> => {
    try {
      const data = await fetchHrPermissionsSchema();
      setSchema(data);
    } catch {
      setSchema(null);
    }
  }, []);

  const fetchUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await fetchHrAdminUsers({ search, role, active: true, page: 1, per_page: 200 });
      setItems(data.items);
      setTotal(data.total);
      setForbidden(false);
      setErrorMessage("");
    } catch (e: any) {
      setItems([]);
      setTotal(0);
      setForbidden(true);
      setErrorMessage(e?.message || "");
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  useEffect(() => {
    if (!enabled) return;
    fetchSchema();
  }, [enabled, fetchSchema]);

  useEffect(() => {
    if (!enabled) return;
    fetchUsers();
  }, [enabled, fetchUsers]);

  return {
    schema,
    items,
    total,
    search,
    setSearch,
    role,
    setRole,
    loading,
    forbidden,
    errorMessage,
    refetch: fetchUsers,
  };
};
