import type { DbDepartment } from "@/shared/hooks";

/**
 * The Direct Manager rules, in the one place both position forms and the
 * appointment quick-edit read them from.
 *
 * A position has no manager of its own: the "Direct Manager" field on the
 * Positions & Appointments forms is the DEPARTMENT's configured manager
 * (`hr.department.manager_id`), which the backend then applies to every
 * employee in that department. Nothing here re-derives a reporting chain —
 * it only decides which value the form shows and whether it changed.
 */

/** The manager a department currently configures, as a form value ("" = none). */
export const departmentManagerValue = (
  departments: DbDepartment[],
  departmentId: string | null | undefined,
): string => {
  if (!departmentId) return "";
  return departments.find((department) => department.id === departmentId)?.manager_id || "";
};

/**
 * The `manager_id` key a designation create/update should carry — an empty
 * object when the field was not touched.
 *
 * Sent only when it actually differs from what the department already stores,
 * so opening a position, changing its title and saving cannot quietly re-apply
 * a stale manager over one somebody else changed in the meantime.
 */
export const directManagerPatch = (
  departments: DbDepartment[],
  departmentId: string,
  managerId: string,
): { manager_id?: string | null } => {
  if (!departmentId) return {};
  if (departmentManagerValue(departments, departmentId) === managerId) return {};
  return { manager_id: managerId || null };
};
