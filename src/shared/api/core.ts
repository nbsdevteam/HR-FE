import { hrCall } from "./client";
import { mapEmployee, mapDepartment, mapDepartmentTree, mapDepartmentMetadata } from "./mappers";
import type { DbEmployee, DbDepartment, DepartmentTreeNode, DepartmentTreeResult, DepartmentMetadata } from "../hooks";
import { items, eid } from "./httpHelpers";
import { dedupeBy } from "../utils/collections";

export type DepartmentListParams = {
  includeArchived?: boolean;
};

export type DepartmentListResult = {
  items: DbDepartment[];
  total: number;
};

export type DepartmentDeleteResult = {
  id: number;
  deleted: boolean;
  active: boolean;
  employee_count?: number;
  child_count?: number;
};

export const fetchEmployees = async (): Promise<DbEmployee[]> => {
  // Backend allows up to 5000; load the full active roster for dropdowns.
  const rows = await items<any>("/api/hr/employees/list", { limit: 5000, offset: 0 });
  return rows.map(mapEmployee);
}

/** Scoped dashboard cards from Odoo (present/absent/on_leave/late). */
export const fetchHrDashboard = async (params?: {
  departmentId?: string | number;
  newJoinerDays?: number;
}): Promise<Record<string, unknown>> => {
  const body: Record<string, unknown> = {};
  if (params?.departmentId != null) body.department_id = eid(params.departmentId);
  if (params?.newJoinerDays != null) body.new_joiner_days = params.newJoinerDays;
  return hrCall("/api/hr/dashboard", body);
}

/** Current user's linked hr.employee (JWT only; does not require hr.employees.list). */
export const fetchCurrentEmployee = async (): Promise<DbEmployee> => {
  const data = await hrCall<any>("/api/hr/employees/me", {});
  return mapEmployee(data);
}

export const fetchDepartments = async (): Promise<DbDepartment[]> => {
  const rows = await items<any>("/api/hr/departments/list", { limit: 200 });
  return dedupeBy(rows.map(mapDepartment), d => d.id);
}

/** Full list for the org-structure admin screen — `include_archived` filter, plus `total` (backend §1). */
export const fetchDepartmentsAdmin = async (params: DepartmentListParams = {}): Promise<DepartmentListResult> => {
  const data = await hrCall<{ items?: any[]; total?: number } | any[]>("/api/hr/departments/list", {
    limit: 200,
    include_archived: params.includeArchived,
  });
  const rows = Array.isArray(data) ? data : data?.items || [];
  const total = Array.isArray(data) ? rows.length : Number(data?.total) || rows.length;
  return { items: dedupeBy(rows.map(mapDepartment), d => d.id), total };
}

export const fetchDepartment = async (departmentId: string | number): Promise<DbDepartment> => {
  const row = await hrCall<any>(`/api/hr/departments/${eid(departmentId)}`, {});
  return mapDepartment(row);
}

/** Nested org chart with rolled-up counts (backend §3). */
export const fetchDepartmentTree = async (includeArchived = false): Promise<DepartmentTreeResult> => {
  const data = await hrCall<{ items?: any[]; total?: number; unassigned_employee_count?: number }>(
    "/api/hr/departments/tree",
    { include_archived: includeArchived },
  );
  const items: DepartmentTreeNode[] = (data?.items || []).map(mapDepartmentTree);
  return {
    items,
    total: Number(data?.total) || 0,
    unassignedEmployeeCount: Number(data?.unassigned_employee_count) || 0,
  };
}

/** Form choices + `can_manage` for the org-structure admin screen (backend §7). */
export const fetchDepartmentMetadata = async (): Promise<DepartmentMetadata> => {
  const data = await hrCall<any>("/api/hr/departments/metadata", {});
  return mapDepartmentMetadata(data);
}

/** Guarded archive — refused while the department is still in use unless `force: true` (backend §6). */
export const deleteDepartment = async (
  departmentId: string | number,
  opts: { force?: boolean } = {},
): Promise<DepartmentDeleteResult> => {
  return hrCall<DepartmentDeleteResult>(`/api/hr/departments/${eid(departmentId)}/delete`, { force: !!opts.force });
}

export const restoreDepartment = async (departmentId: string | number): Promise<DbDepartment> => {
  const row = await hrCall<any>(`/api/hr/departments/${eid(departmentId)}/restore`, {});
  return mapDepartment(row);
}

/** Next available employee code/id, computed by Odoo (requires hr.employees.create, falls back to hr.employees.list). */
export const fetchNextEmployeeCode = async (): Promise<{ next_code: string; next_id: number }> => {
  return hrCall("/api/hr/employees/next_code", {});
}

export const createEmployee = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/employees/create", payload);
}

export const updateEmployee = async (employeeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/employees/${eid(employeeId)}/update`, payload);
}

export const setEmployeeStatus = async (employeeId: string | number, status: string) => {
  return hrCall(`/api/hr/employees/${eid(employeeId)}/set_status`, { status });
}

export const updateDepartment = async (
  departmentId: string | number,
  payload: Record<string, unknown>,
) => {
  return hrCall(`/api/hr/departments/${eid(departmentId)}/update`, payload);
}

export type DepartmentBulkUpdateEntry = { id: string | number } & Record<string, unknown>;

/**
 * Replaces a sequential `for...of updateDepartment(...)` loop with one
 * request — all-or-nothing on the backend (every row validated before any
 * write happens), so a bad row can no longer leave earlier rows applied
 * (backend "New endpoint" §, departments/bulk-update).
 */
export const bulkUpdateDepartments = async (
  updates: DepartmentBulkUpdateEntry[],
): Promise<DbDepartment[]> => {
  const data = await hrCall<{ updated?: any[] }>("/api/hr/departments/bulk-update", {
    updates: updates.map((update) => ({ ...update, id: eid(update.id) })),
  });
  return (data?.updated || []).map(mapDepartment);
}

export const createDepartment = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/departments/create", payload);
}

export const linkEmployeesToUsers = async (dry_run = true, employee_ids?: number[]) => {
  return hrCall("/api/hr/employees/link_users", { dry_run, employee_ids });
}
