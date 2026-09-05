import { useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { useCachedList, type DbDepartment } from "@/shared/hooks";

interface DepartmentManagementListResult {
  items: DbDepartment[];
  total: number;
}

/** `include_archived`-filtered department list for the org-structure admin screen (backend §1). */
export const useDepartmentManagementList = () => {
  const [includeArchived, setIncludeArchived] = useState(false);

  const { data, loading, refetch } = useCachedList<DepartmentManagementListResult>(
    "departmentManagementList",
    async () => [await odooData.fetchDepartmentsAdmin({ includeArchived })],
    "Failed to load departments",
    [includeArchived],
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
