import { useCallback, useState } from "react";

export type UseStructureTreeExpansionResult = {
  expandedDepartments: Set<string>;
  toggleDepartment: (departmentId: string) => void;
};

/**
 * Tier-1 collapse state for the level-wise structure graph.
 *
 * Departments start collapsed (handoff doc §2 tier 1) — expanding one reveals
 * its level chain without affecting any other department's state.
 */
export const useStructureTreeExpansion = (): UseStructureTreeExpansionResult => {
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

  const toggleDepartment = useCallback((departmentId: string): void => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(departmentId)) next.delete(departmentId);
      else next.add(departmentId);
      return next;
    });
  }, []);

  return { expandedDepartments, toggleDepartment };
};
