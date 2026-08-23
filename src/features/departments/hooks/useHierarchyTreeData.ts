import { useCallback, useMemo } from "react";
import { useHierarchyData, usePositions } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { OrgNode } from "../types";
import { defaultDeptColorMap } from "../styles";
import {
  buildOrgTree,
  buildOrgTreeFromPositions,
  flattenTree,
  getUnlinkedEmployees,
} from "../utils/hierarchyTree";

/** Stable placeholder tree used while there is nothing to build one from. */
const EMPTY_ORG_TREE: OrgNode = {
  id: 0,
  dbId: "__root__",
  name: arabicSource("common.foundation"),
  initials: arabicSource("common.m"),
  position: arabicSource("common.senior_management"),
  department: arabicSource("common.senior_management"),
  color: "#8B5CF6",
  photo: null,
  email: null,
  children: [],
};

/**
 * Owns every remote read the hierarchy page needs plus the derived tree/lookup
 * shapes built from it. Split out of `useHierarchyPage` so the page hook only
 * composes; all tree derivation lives here behind memos.
 */
export const useHierarchyTreeData = () => {
  const {
    employees: dbEmployees,
    departments: dbDepartments,
    loading: dbLoading,
    refetch,
  } = useHierarchyData();
  const {
    positions: dbPositions,
    loading: positionsLoading,
    refetch: refetchPositions,
  } = usePositions();

  // Build tree from POSITIONS (single source of truth), falling back to the
  // legacy manager_id tree when no positions exist yet.
  const { tree: orgTree, deptColors } = useMemo(() => {
    if (dbPositions.length > 0) {
      return buildOrgTreeFromPositions(dbPositions, dbEmployees, dbDepartments);
    }
    if (dbEmployees.length === 0) {
      return { tree: EMPTY_ORG_TREE, deptColors: defaultDeptColorMap };
    }
    return buildOrgTree(dbEmployees, dbDepartments);
  }, [dbEmployees, dbDepartments, dbPositions]);

  const unlinkedEmps = useMemo(
    () => getUnlinkedEmployees(dbEmployees),
    [dbEmployees],
  );

  const allNodes = useMemo(() => flattenTree(orgTree), [orgTree]);

  const departments = useMemo(() => {
    const names = new Set<string>();
    allNodes.forEach((node) => names.add(node.department));
    dbDepartments.forEach((department) => names.add(department.name));
    return Array.from(names);
  }, [allNodes, dbDepartments]);

  // Live stats from tree
  const departmentStats = useMemo(() => {
    const counts = new Map<string, number>();
    allNodes.forEach((node) => {
      if (node.dbId === "__root__") return;
      counts.set(node.department, (counts.get(node.department) ?? 0) + 1);
    });
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, [allNodes]);

  const refetchHierarchyAndPositions = useCallback(() => {
    refetch();
    refetchPositions();
  }, [refetch, refetchPositions]);

  return {
    dbEmployees,
    dbDepartments,
    dbPositions,
    dbLoading,
    positionsLoading,
    refetch,
    refetchPositions,
    orgTree,
    deptColors,
    unlinkedEmps,
    allNodes,
    departments,
    departmentStats,
    refetchHierarchyAndPositions,
  };
};
