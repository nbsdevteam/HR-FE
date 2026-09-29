import { hrCall } from "./client";
import { mapEmployee, mapDepartment, mapDepartmentTree, mapDepartmentMetadata } from "./mappers";
import { sid, num } from "./mappers/mapHelpers";
import type {
  DbEmployee,
  DbDepartment,
  DepartmentTreeNode,
  DepartmentTreeResult,
  DepartmentMetadata,
  EmployeeStatusCode,
} from "../hooks";
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

export type EmployeeAvatar = { id: string; photo: string | null; photoVersion: number };

/** Backend refuses more than this in one call (`too_many_ids`) — chunk client-side. */
const AVATAR_IDS_PER_CHUNK = 200;

/**
 * Profile pictures for the rows on screen. `/employees/list` deliberately
 * carries none (§2.1 of the avatar hand-off) — a base64 thumbnail per row on
 * a 5000-row roster fetch would be several megabytes — so this is the
 * dedicated batch fetch for whatever ids the caller actually renders.
 * Chunked at the backend's 200-id cap; an id out of the caller's scope, or
 * that doesn't exist, is simply absent from the result rather than an error.
 */
export const fetchEmployeeAvatars = async (
  employeeIds: readonly (string | number)[],
): Promise<EmployeeAvatar[]> => {
  const ids = Array.from(new Set(employeeIds.map(eid)));
  if (ids.length === 0) return [];

  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += AVATAR_IDS_PER_CHUNK) {
    chunks.push(ids.slice(i, i + AVATAR_IDS_PER_CHUNK));
  }

  const pages = await Promise.all(
    chunks.map(chunk => items<any>("/api/hr/employees/avatars", { employee_ids: chunk })),
  );
  return pages.flat().map(row => ({
    id: sid(row.id),
    photo: row.photo || null,
    photoVersion: num(row.photo_version),
  }));
}

export type { EmployeeListParams, EmployeeListPage } from "./employeeList";
export { DEFAULT_EMPLOYEE_PAGE_SIZE, fetchEmployeesPage } from "./employeeList";

export type EmployeeDeleteResult = {
  id: number;
  deleted: boolean;
  hard: boolean;
  active?: boolean;
  status?: string;
  end_date?: string | null;
  report_count?: number;
  department_count?: number;
  name?: string;
  employee_code?: string;
};

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
export const fetchNextEmployeeCode = async (): Promise<{
  next_code: string;
  next_id: number;
  /** Sequence-backed, never-reused Hikvision device number — independent of next_id. */
  next_device_no: number | string | null;
}> => {
  return hrCall("/api/hr/employees/next_code", {});
}

export const createEmployee = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/employees/create", payload);
}

export const updateEmployee = async (employeeId: string | number, payload: Record<string, unknown>) => {
  return hrCall(`/api/hr/employees/${eid(employeeId)}/update`, payload);
}

export const setEmployeeStatus = async (employeeId: string | number, status: EmployeeStatusCode | (string & {})) => {
  return hrCall(`/api/hr/employees/${eid(employeeId)}/set_status`, { status });
}

/**
 * Guarded archive by default (`active = false`, `status = 'exited'`); `hard: true`
 * permanently removes the row and is refused once any history exists
 * (`employee_has_records`). `force: true` only waives the archive path's
 * direct-reports / managed-departments refusal (`employee_in_use`) (backend §3).
 */
export const deleteEmployee = async (
  employeeId: string | number,
  opts: { hard?: boolean; force?: boolean; endDate?: string } = {},
): Promise<EmployeeDeleteResult> => {
  return hrCall<EmployeeDeleteResult>(`/api/hr/employees/${eid(employeeId)}/delete`, {
    hard: !!opts.hard,
    force: !!opts.force,
    ...(opts.endDate ? { end_date: opts.endDate } : {}),
  });
}

/** Un-archives an employee: `active = true`, `status = 'active'`, clears `end_date` (backend §3.3). */
export const restoreEmployee = async (employeeId: string | number): Promise<DbEmployee> => {
  const row = await hrCall<any>(`/api/hr/employees/${eid(employeeId)}/restore`, {});
  return mapEmployee(row);
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
