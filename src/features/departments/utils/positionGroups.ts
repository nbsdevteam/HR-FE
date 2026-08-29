import type { DbDepartment } from "@/shared/hooks";
import { empDisplayName } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type {
  PositionDepartmentGroup,
  PositionFillState,
  PositionFilter,
  PositionNode,
  PositionRow,
} from "../types";

/** Group key for positions that carry no department. */
export const NO_DEPARTMENT_KEY = "__no_department__";

const FALLBACK_DEPT_COLOR = "#8B5CF6";

export const fillStateOf = (node: PositionNode): PositionFillState => {
  const assigned = node.assignedEmployees.length;
  if (assigned > node.max_headcount) return "over";
  // `>=` also covers a position whose headcount is zero: nothing can be dropped on it.
  if (assigned >= node.max_headcount) return "full";
  return assigned === 0 ? "vacant" : "partial";
};

/**
 * Depth-first flatten of the position tree, parents before their reports, so
 * positions from the same reporting branch land next to each other once
 * grouped by department.
 */
export const flattenPositionRows = (tree: PositionNode[]): PositionRow[] => {
  const rows: PositionRow[] = [];

  const walk = (nodes: PositionNode[]): void => {
    nodes.forEach((node) => {
      rows.push({
        node,
        fillState: fillStateOf(node),
        canAccept: node.assignedEmployees.length < node.max_headcount,
      });
      walk(node.children);
    });
  };

  walk(tree);
  return rows;
};

const matchesQuery = (
  row: PositionRow,
  query: string,
  departmentsById: Map<string, DbDepartment>,
): boolean => {
  const { node } = row;
  if (node.title_ar.toLowerCase().includes(query)) return true;
  if ((node.title_en || "").toLowerCase().includes(query)) return true;

  const department = node.department_id ? departmentsById.get(node.department_id) : undefined;
  if ((department?.name || "").toLowerCase().includes(query)) return true;

  return node.assignedEmployees.some((employee) =>
    empDisplayName(employee).toLowerCase().includes(query),
  );
};

/** Free-text filter across position title, department name and the people already in it. */
export const filterPositionRowsByQuery = (
  rows: PositionRow[],
  search: string,
  departmentsById: Map<string, DbDepartment>,
): PositionRow[] => {
  const query = search.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) => matchesQuery(row, query, departmentsById));
};

export const matchesPositionFilter = (row: PositionRow, filter: PositionFilter): boolean => {
  if (filter === "all") return true;
  return row.fillState === filter;
};

/** Live chip counts, tallied over whatever the search has already narrowed to. */
export const countPositionRows = (rows: PositionRow[]): Record<PositionFilter, number> => {
  const counts: Record<PositionFilter, number> = { all: rows.length, vacant: 0, partial: 0, over: 0 };
  rows.forEach((row) => {
    if (row.fillState === "vacant") counts.vacant += 1;
    else if (row.fillState === "partial") counts.partial += 1;
    else if (row.fillState === "over") counts.over += 1;
  });
  return counts;
};

/**
 * Buckets the flattened rows under their department, keeping the tree order
 * inside each bucket so related positions still land near each other in the
 * department's card grid.
 */
export const groupPositionRows = (
  rows: PositionRow[],
  departmentsById: Map<string, DbDepartment>,
  deptColors: Record<string, string>,
): PositionDepartmentGroup[] => {
  const groups = new Map<string, PositionDepartmentGroup>();

  rows.forEach((row) => {
    const department = row.node.department_id
      ? departmentsById.get(row.node.department_id)
      : undefined;
    const id = department?.id ?? NO_DEPARTMENT_KEY;

    let group = groups.get(id);
    if (!group) {
      group = {
        id,
        name: department?.name || arabicSource("common.no_section"),
        color: department
          ? deptColors[department.name] || department.color || FALLBACK_DEPT_COLOR
          : FALLBACK_DEPT_COLOR,
        rows: [],
        vacancies: 0,
      };
      groups.set(id, group);
    }

    group.rows.push(row);
    group.vacancies += Math.max(0, row.node.max_headcount - row.node.assignedEmployees.length);
  });

  return [...groups.values()];
};
