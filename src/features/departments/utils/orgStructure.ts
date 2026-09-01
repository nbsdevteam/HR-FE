import type {
  OrgStructureDepartment,
  OrgStructurePosition,
} from "@/shared/hooks";

/**
 * Pure transforms for the Organizational Structure screen.
 *
 * Kept out of the components so they can be unit-tested, matching how
 * `hierarchyTree.ts` and `gradeLadder.ts` are structured.
 *
 * Nothing here touches grade — the payload carries none.
 */

/** Consecutive positions that share a `level`, in the order the backend sent them. */
export interface OrgLevelGroup {
  /** `null` for positions with no seniority assigned — render no level chip. */
  level: number | null;
  positions: OrgStructurePosition[];
}

/**
 * Groups the department's positions into level bands.
 *
 * The backend already sorted `positions` most senior first, so this walks the
 * array and starts a new band whenever `level` changes. It never re-sorts and
 * never uses the array index as a level: peers share a level by design, so a
 * five-position department can legitimately span only two bands.
 */
export const groupPositionsByLevel = (
  positions: OrgStructurePosition[],
): OrgLevelGroup[] => {
  const groups: OrgLevelGroup[] = [];
  for (const position of positions) {
    const last = groups[groups.length - 1];
    if (last && last.level === position.level) last.positions.push(position);
    else groups.push({ level: position.level, positions: [position] });
  }
  return groups;
};

/**
 * Arabic label with an English fallback.
 *
 * `department_ar` and `title_ar` are frequently empty on real rows, and an
 * empty string would render as a blank card heading.
 */
export const orgLabel = (primary: string, arabic: string): string =>
  arabic.trim() || primary;

/** Total people actually holding a position in this department. */
export const departmentStaffOnPositions = (
  department: OrgStructureDepartment,
): number =>
  department.positions.reduce((sum, position) => sum + position.employee_count, 0);

/** Budgeted seats across the department's positions. */
export const departmentSeats = (department: OrgStructureDepartment): number =>
  department.positions.reduce((sum, position) => sum + position.seats, 0);

/**
 * Employees in the department who hold no position.
 *
 * `department.employee_count` counts everyone whose department matches,
 * including people with no position, so it is not the sum of the rows shown
 * beneath it. This is the difference, floored at 0 — an employee can sit on a
 * position belonging to another department, which would otherwise make this
 * negative.
 */
export const departmentStaffWithoutPosition = (
  department: OrgStructureDepartment,
): number =>
  Math.max(0, department.employee_count - departmentStaffOnPositions(department));

/** A position nobody holds. Seats may still be budgeted for it. */
export const isPositionVacant = (position: OrgStructurePosition): boolean =>
  position.employee_count === 0;

/** True when the department has neither positions nor employees — nothing to show but its name. */
export const isDepartmentEmpty = (
  department: OrgStructureDepartment,
): boolean =>
  department.positions.length === 0 && department.employee_count === 0;
