import { useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { STALE_TIME } from "@/shared/api/queryClient";
import { useCachedList, type DbPosition } from "@/shared/hooks";

interface DesignationManagementListResult {
  items: DbPosition[];
  total: number;
}

/** `include_archived`-filtered job-title list for the org-structure admin screen (backend §1). */
export const useDesignationManagementList = () => {
  const [includeArchived, setIncludeArchived] = useState(false);

  const { data, loading, refetch } = useCachedList<DesignationManagementListResult>(
    "designationManagementList",
    async () => [await odooData.fetchDesignationsAdmin({ includeArchived })],
    "Failed to load designations",
    [includeArchived],
    true,
    { ttlMs: STALE_TIME.LONG },
  );

  return {
    items: data[0]?.items ?? [],
    total: data[0]?.total ?? 0,
    loading,
    includeArchived,
    setIncludeArchived,
    refetch,
  };
};
