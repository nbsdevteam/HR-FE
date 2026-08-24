import type { DbDepartment } from "@/shared/hooks";

/**
 * The report filter bar keeps `filterDept` as a department *name* (the FE-local
 * generators in reportGenerators.ts compare against `empDeptMap`, which is
 * name-keyed). The backend `/api/hr/reports/generate` endpoint wants a numeric
 * `department_id` — this bridges the two without changing what `filterDept` holds.
 */
export const departmentIdFromName = (departments: DbDepartment[], name: string): number | undefined => {
  if (!name) return undefined;
  const dept = departments.find((d) => d.name === name);
  return dept ? Number(dept.id) : undefined;
};
