import { useState, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import type { DepartmentTreeNode } from "@/shared/hooks";

/** Nested department chart with rolled-up counts, for the org-structure tree tab (backend §3). */
export const useOrgStructureTree = (includeArchived: boolean) => {
  const [items, setItems] = useState<DepartmentTreeNode[]>([]);
  const [total, setTotal] = useState(0);
  const [unassignedEmployeeCount, setUnassignedEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await odooData.fetchDepartmentTree(includeArchived);
      setItems(result.items);
      setTotal(result.total);
      setUnassignedEmployeeCount(result.unassignedEmployeeCount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { items, total, unassignedEmployeeCount, loading, refetch, expandedIds, toggleExpand };
};
