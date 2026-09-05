import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHrRoles, type HrRoleListItem } from "../api/permissionsAdmin";

interface HrRolesResult {
  items: HrRoleListItem[];
  total: number;
}

/**
 * Directory (search/list) state for the Job Roles tab. `enabled` defers the
 * fetch until that tab is actually selected, mirroring `useHrPermissionsAdmin`.
 */
export const useHrRolesAdmin = (enabled: boolean) => {
  const [search, setSearch] = useState("");

  const rolesQuery = useQuery<HrRolesResult, Error>({
    queryKey: ["hrRoles", search],
    queryFn: () => fetchHrRoles({ search, active: true }),
    enabled,
  });

  const refetch = useCallback((): void => {
    void rolesQuery.refetch();
  }, [rolesQuery.refetch]);

  return {
    items: rolesQuery.data?.items ?? [],
    total: rolesQuery.data?.total ?? 0,
    search,
    setSearch,
    loading: rolesQuery.isFetching,
    forbidden: rolesQuery.isError,
    refetch,
  };
};
