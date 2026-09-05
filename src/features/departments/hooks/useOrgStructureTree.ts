import { useCallback, useState } from "react";
import * as odooData from "@/shared/api/odooData";
import { useCachedList, type DepartmentTreeNode } from "@/shared/hooks";

interface OrgStructureTreeResult {
  items: DepartmentTreeNode[];
  total: number;
  unassignedEmployeeCount: number;
}

/** Nested department chart with rolled-up counts, for the org-structure tree tab (backend §3). */
export const useOrgStructureTree = (includeArchived: boolean) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data, loading, refetch } = useCachedList<OrgStructureTreeResult>(
    "orgStructureTree",
    async () => [await odooData.fetchDepartmentTree(includeArchived)],
    "Failed to load department tree",
    [includeArchived],
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return {
    items: data[0]?.items ?? [],
    total: data[0]?.total ?? 0,
    unassignedEmployeeCount: data[0]?.unassignedEmployeeCount ?? 0,
    loading,
    refetch,
    expandedIds,
    toggleExpand,
  };
};
