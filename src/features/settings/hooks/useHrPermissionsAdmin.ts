import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchHrAdminUsers,
  fetchHrPermissionsSchema,
  type HrAdminUserListItem,
  type HrPermissionsSchema,
} from "../api/permissionsAdmin";

interface HrAdminUsersResult {
  items: HrAdminUserListItem[];
  total: number;
}

/**
 * Directory (search/filter/list) + schema state for the Roles & Permissions
 * card. `enabled` defers both fetches until the card's dialog is actually
 * opened, so having `hr.roles_permissions.view` doesn't cost an API call on
 * every Settings page load.
 */
export const useHrPermissionsAdmin = (enabled: boolean) => {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const schemaQuery = useQuery<HrPermissionsSchema, Error>({
    queryKey: ["hrPermissionsSchema"],
    queryFn: fetchHrPermissionsSchema,
    enabled,
  });

  const usersQuery = useQuery<HrAdminUsersResult, Error>({
    queryKey: ["hrAdminUsers", search, role],
    queryFn: () => fetchHrAdminUsers({ search, role, active: true, page: 1, per_page: 200 }),
    enabled,
  });

  const refetch = useCallback((): void => {
    void usersQuery.refetch();
  }, [usersQuery.refetch]);

  return {
    schema: schemaQuery.data ?? null,
    items: usersQuery.data?.items ?? [],
    total: usersQuery.data?.total ?? 0,
    search,
    setSearch,
    role,
    setRole,
    loading: usersQuery.isFetching,
    forbidden: usersQuery.isError,
    errorMessage: usersQuery.error?.message ?? "",
    refetch,
  };
};
