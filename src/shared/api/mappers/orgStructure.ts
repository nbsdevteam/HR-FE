import type {
  OrgReportingNode,
  OrgStructureDepartment,
  OrgStructureEmployee,
  OrgStructurePosition,
  OrgStructureTotals,
  OrgStructureTree,
} from "../../hooks";
import { bool, sid, sornull, num } from "./mapHelpers";

/**
 * `/api/hr/org-structure/tree`.
 *
 * No grade field is read here because the backend sends none — see
 * `docs/ORGANIZATIONAL_STRUCTURE_FE_HANDOFF.md` §0.
 */

const mapEmployee = (r: any): OrgStructureEmployee => {
  return {
    employee_id: sid(r.employee_id),
    name: r.name || "",
    employee_code: r.employee_code || "",
    job_title: r.job_title || "",
  };
};

const mapPosition = (r: any): OrgStructurePosition => {
  const employees = Array.isArray(r.employees) ? r.employees.map(mapEmployee) : [];
  return {
    position_id: sid(r.position_id),
    title: r.title || "",
    title_ar: r.title_ar || "",
    // `level` is nullable and 0 is not a valid level, so `num()` would turn a
    // legitimate null into a rank. Preserve the null instead.
    level: typeof r.level === "number" ? r.level : null,
    seats: num(r.seats),
    employee_count: num(r.employee_count, employees.length),
    vacancies: num(r.vacancies),
    employees,
  };
};

const mapDepartment = (r: any): OrgStructureDepartment => {
  const positions = Array.isArray(r.positions) ? r.positions.map(mapPosition) : [];
  return {
    department_id: sid(r.department_id),
    department: r.department || "",
    department_ar: r.department_ar || "",
    parent_department_id: sornull(r.parent_department_id),
    parent_department: r.parent_department || "",
    sort_order: num(r.sort_order),
    employee_count: num(r.employee_count),
    position_count: num(r.position_count, positions.length),
    level_count: num(r.level_count),
    positions,
  };
};

/**
 * A `reporting_tree` node — reuses `mapPosition` rather than duplicating its
 * fields, then layers on the reporting-line/department/recursion fields the
 * flat position payload doesn't carry.
 *
 * `reports_to_position_id` and `department_id` arrive as `false` (Odoo's
 * "no value"), not `null`, so `sornull()` is required here — `sid()` would
 * stringify `false` into `"false"`.
 */
const mapReportingNode = (r: any): OrgReportingNode => {
  return {
    ...mapPosition(r),
    reports_to_position_id: sornull(r.reports_to_position_id),
    department_id: sornull(r.department_id),
    department: r.department || "",
    department_ar: r.department_ar || "",
    children: Array.isArray(r.children) ? r.children.map(mapReportingNode) : [],
  };
};

const mapTotals = (r: any): OrgStructureTotals => {
  return {
    departments: num(r?.departments),
    positions: num(r?.positions),
    seats: num(r?.seats),
    employees_on_positions: num(r?.employees_on_positions),
    employees_total: num(r?.employees_total),
    employees_without_department: num(r?.employees_without_department),
  };
};

export const mapOrgStructureTree = (r: any): OrgStructureTree => {
  return {
    departments: Array.isArray(r?.departments) ? r.departments.map(mapDepartment) : [],
    positions_without_department: Array.isArray(r?.positions_without_department)
      ? r.positions_without_department.map(mapPosition)
      : [],
    reporting_tree: Array.isArray(r?.reporting_tree) ? r.reporting_tree.map(mapReportingNode) : [],
    reporting_tree_is_flat: bool(r?.reporting_tree_is_flat),
    totals: mapTotals(r?.totals),
  };
};
