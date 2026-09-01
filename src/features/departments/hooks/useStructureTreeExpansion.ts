import { useCallback, useState } from "react";

export type UseStructureTreeExpansionResult = {
  collapsedDepartments: Set<string>;
  toggleDepartment: (departmentId: string) => void;
};

/**
 * Tier-1 collapse state for the level-wise structure graph.
 *
 * Departments start **expanded**: the point of this screen is the hierarchy
 * under each department, and hiding it behind a chevron made the page read as
 * a flat row of cards. Collapsing is tracked instead of expanding so a
 * department the user has not touched stays open.
 */
export const useStructureTreeExpansion = (): UseStructureTreeExpansionResult => {
  const [collapsedDepartments, setCollapsedDepartments] = useState<Set<string>>(new Set());

  const toggleDepartment = useCallback((departmentId: string): void => {
    setCollapsedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(departmentId)) next.delete(departmentId);
      else next.add(departmentId);
      return next;
    });
  }, []);

  return { collapsedDepartments, toggleDepartment };
};
