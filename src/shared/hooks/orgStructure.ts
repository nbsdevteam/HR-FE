import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";

/**
 * Organizational Structure: department → position → employee.
 *
 * GRADE IS DELIBERATELY ABSENT. The backend does not send the grade code,
 * name or band for this screen, so it cannot be rendered by mistake.
 * Seniority arrives only as `level` — see `OrgStructurePosition.level`.
 */

/** One real person holding a position. Never synthesised — if nobody holds the position, the list is empty. */
export interface OrgStructureEmployee {
  employee_id: string;
  name: string;
  /** Often empty — do not render an empty badge. */
  employee_code: string;
  /** Free-text title on the employee record; usually mirrors the position title. */
  job_title: string;
}

export interface OrgStructurePosition {
  position_id: string;
  title: string;
  /** May be empty — fall back to `title`. */
  title_ar: string;
  /**
   * Seniority within this department only. 1 = most senior.
   *
   * A DENSE rank, not a row number: positions of equal seniority share a
   * level, so a department with five positions may span only two levels.
   * `null` means the position has no seniority assigned — render no level
   * chip and never coerce it to 0.
   *
   * Never compare levels across departments; the rank restarts per department.
   */
  level: number | null;
  /** Budgeted headcount for the position. */
  seats: number;
  /** `employees.length`, sent by the backend. */
  employee_count: number;
  /** `max(0, seats - employee_count)` — never negative. */
  vacancies: number;
  employees: OrgStructureEmployee[];
}

export interface OrgStructureDepartment {
  department_id: string;
  department: string;
  /** May be empty — fall back to `department`. */
  department_ar: string;
  parent_department_id: string | null;
  parent_department: string;
  sort_order: number;
  /**
   * Employees whose department is this one — including people holding no
   * position at all. It is NOT the sum of `positions[].employee_count`, so it
   * must not be presented as a total of the rows beneath it.
   */
  employee_count: number;
  position_count: number;
  /** Distinct non-null levels present in `positions`. */
  level_count: number;
  /** Pre-sorted most senior first. Render in array order. */
  positions: OrgStructurePosition[];
}

/**
 * One node of the reporting-line tree — a position, its department, and its
 * direct reports, recursively. Extends `OrgStructurePosition` rather than
 * duplicating its fields (position/employees are identical shapes).
 *
 * A reporting line can cross departments, so `department`/`department_ar`
 * are carried on every node rather than inherited from an ancestor.
 */
export interface OrgReportingNode extends OrgStructurePosition {
  /** `null` = reports to nobody — a real root, never a synthetic one. */
  reports_to_position_id: string | null;
  /** `null` = no department (Odoo sends `false`). */
  department_id: string | null;
  /** May be empty — fall back to `title`/`department`. */
  department_ar: string;
  department: string;
  /** Same node shape, recursive. Pre-sorted by the backend — render in array order. */
  children: OrgReportingNode[];
}

export interface OrgStructureTotals {
  departments: number;
  positions: number;
  seats: number;
  employees_on_positions: number;
  employees_total: number;
  employees_without_department: number;
}

export interface OrgStructureTree {
  /** Pre-sorted by the backend (sort_order, then name). Render in array order. */
  departments: OrgStructureDepartment[];
  /** Positions carrying no department. Kept separate so the UI can label them honestly — never fold them into a real department. */
  positions_without_department: OrgStructurePosition[];
  /**
   * The same 39 positions, nested by `reports_to_position_id` instead of
   * grouped by department. A position with no reporting line, or whose
   * reported-to position is missing/cyclic, becomes a root here.
   */
  reporting_tree: OrgReportingNode[];
  /** `true` while no reporting line has been entered anywhere — `reporting_tree` is flat (every node a childless root). */
  reporting_tree_is_flat: boolean;
  totals: OrgStructureTotals;
}

export type UseOrgStructureResult = {
  tree: OrgStructureTree | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

/**
 * The whole Organizational Structure screen in one request.
 *
 * `POST /api/hr/org-structure/tree` returns the entire tree, so this is the
 * only call the screen makes — the structure is never reassembled from
 * several endpoints.
 */
export const useOrgStructure = (departmentId?: string): UseOrgStructureResult => {
  const { data, loading, error, refetch } = useCachedList(
    `orgStructure:${departmentId ?? "all"}`,
    async () => [await odooData.fetchOrgStructureTree(departmentId)],
    "Failed to load the organizational structure",
    [departmentId],
  );
  return { tree: data[0] ?? null, loading, error, refetch };
};
