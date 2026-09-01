import type {
  OrgStructureDepartment,
  OrgStructureEmployee,
  OrgStructurePosition,
  OrgStructureTree,
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

/**
 * Search/filter support for the level-wise graph.
 *
 * These walk the same tree the graph renders (departments + the orphan
 * bucket), never a second source, so results always point at a card that is
 * actually on screen.
 */

/** A position paired with the department it belongs to (`undefined` for the orphan bucket). */
export interface PositionWithDepartment {
  position: OrgStructurePosition;
  department: OrgStructureDepartment | undefined;
}

const allPositionsWithDepartment = (
  tree: OrgStructureTree,
): PositionWithDepartment[] => [
  ...tree.departments.flatMap((department) =>
    department.positions.map((position) => ({ position, department })),
  ),
  ...tree.positions_without_department.map((position) => ({
    position,
    department: undefined,
  })),
];

/** Position id as used in `matchStructureIds` / `data-structure-id`. */
export const positionMatchId = (position: OrgStructurePosition): string =>
  `pos:${position.position_id}`;

/** Employee id as used in `matchStructureIds` / `data-structure-id`. */
export const employeeMatchId = (
  employee: { employee_id: string },
): string => `emp:${employee.employee_id}`;

/** Finds a position by id anywhere in the tree (a real department or the orphan bucket). */
export const findStructurePosition = (
  tree: OrgStructureTree,
  positionId: string,
): PositionWithDepartment | null =>
  allPositionsWithDepartment(tree).find(
    ({ position }) => position.position_id === positionId,
  ) ?? null;

/** Finds an employee by id anywhere in the tree, along with their position/department. */
export const findStructureEmployee = (
  tree: OrgStructureTree,
  employeeId: string,
): (PositionWithDepartment & { employee: OrgStructureEmployee }) | null => {
  for (const { position, department } of allPositionsWithDepartment(tree)) {
    const employee = position.employees.find((e) => e.employee_id === employeeId);
    if (employee) return { position, department, employee };
  }
  return null;
};

/** Distinct department names across the tree, in first-seen (array) order. */
export const structureDepartmentOptions = (
  tree: OrgStructureTree | null,
): string[] => {
  if (!tree) return [];
  const seen = new Set<string>();
  const names: string[] = [];
  tree.departments.forEach((department) => {
    const label = orgLabel(department.department, department.department_ar);
    if (!seen.has(label)) {
      seen.add(label);
      names.push(label);
    }
  });
  return names;
};

/** Distinct position titles across the tree (departments + orphans), in first-seen order. */
export const structureJobTitleOptions = (
  tree: OrgStructureTree | null,
): string[] => {
  if (!tree) return [];
  const seen = new Set<string>();
  const titles: string[] = [];
  allPositionsWithDepartment(tree).forEach(({ position }) => {
    const label = orgLabel(position.title, position.title_ar);
    if (!seen.has(label)) {
      seen.add(label);
      titles.push(label);
    }
  });
  return titles;
};

/** One row in the header search dropdown. */
export interface OrgSearchHit {
  kind: "position" | "employee";
  /** `pos:<position_id>` or `emp:<employee_id>` — matches `matchStructureIds`/`data-structure-id`. */
  id: string;
  name: string;
  subtitle: string;
  department: string;
}

/**
 * Whether `query` appears in either language variant of a label — the query
 * can be typed in English or Arabic regardless of which one `orgLabel` picked
 * to display, since `title_ar`/`department_ar` are usually populated on real
 * data and would otherwise make the English name unsearchable.
 */
const matchesEitherLabel = (
  query: string,
  primary: string,
  arabic: string,
): boolean =>
  primary.toLowerCase().includes(query) || arabic.toLowerCase().includes(query);

/** Employee/position/department name search, case-insensitive substring match. */
export const searchStructureNodes = (
  tree: OrgStructureTree | null,
  query: string,
): OrgSearchHit[] => {
  const trimmed = query.trim().toLowerCase();
  if (!tree || !trimmed) return [];

  const hits: OrgSearchHit[] = [];
  allPositionsWithDepartment(tree).forEach(({ position, department }) => {
    const departmentLabel = department
      ? orgLabel(department.department, department.department_ar)
      : "";
    const positionLabel = orgLabel(position.title, position.title_ar);
    const levelLabel =
      position.level === null ? "" : `Level ${position.level}`;

    if (
      matchesEitherLabel(trimmed, position.title, position.title_ar) ||
      (department &&
        matchesEitherLabel(trimmed, department.department, department.department_ar))
    ) {
      hits.push({
        kind: "position",
        id: positionMatchId(position),
        name: positionLabel,
        subtitle: [departmentLabel, levelLabel].filter(Boolean).join(" — "),
        department: departmentLabel,
      });
    }

    position.employees.forEach((employee) => {
      if (!employee.name.toLowerCase().includes(trimmed)) return;
      hits.push({
        kind: "employee",
        id: employeeMatchId(employee),
        name: employee.name,
        subtitle: [positionLabel, departmentLabel].filter(Boolean).join(" — "),
        department: departmentLabel,
      });
    });
  });
  return hits;
};

export interface StructureFilters {
  query: string;
  departmentFilter: string;
  jobTitleFilter: string;
}

/**
 * Ids (`pos:<id>` / `emp:<id>`) of every card that satisfies the active
 * query/filters. An employee match also marks its position matched, so the
 * position card highlights along with the person inside it. Returns an empty
 * set when nothing is active — callers treat that as "no highlighting", never
 * "everything highlighted".
 */
export const matchStructureIds = (
  tree: OrgStructureTree | null,
  { query, departmentFilter, jobTitleFilter }: StructureFilters,
): Set<string> => {
  const matched = new Set<string>();
  const trimmedQuery = query.trim().toLowerCase();
  if (!tree || (!trimmedQuery && !departmentFilter && !jobTitleFilter)) {
    return matched;
  }

  allPositionsWithDepartment(tree).forEach(({ position, department }) => {
    const departmentLabel = department
      ? orgLabel(department.department, department.department_ar)
      : "";
    const positionLabel = orgLabel(position.title, position.title_ar);

    if (departmentFilter && departmentLabel !== departmentFilter) return;
    if (jobTitleFilter && positionLabel !== jobTitleFilter) return;

    const matchingEmployees = position.employees.filter(
      (employee) =>
        !trimmedQuery || employee.name.toLowerCase().includes(trimmedQuery),
    );
    const positionMatchesQuery =
      !trimmedQuery ||
      matchesEitherLabel(trimmedQuery, position.title, position.title_ar) ||
      (department &&
        matchesEitherLabel(trimmedQuery, department.department, department.department_ar));

    if (positionMatchesQuery || matchingEmployees.length > 0) {
      matched.add(positionMatchId(position));
    }
    matchingEmployees.forEach((employee) =>
      matched.add(employeeMatchId(employee)),
    );
  });

  return matched;
};
