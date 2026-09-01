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

export type EmployeeListParams = {
  /** 1-based. The backend derives `offset` as `(page - 1) * limit` (backend §1). */
  page?: number;
  limit?: number;
  /** OR-ilike across name, work email, employee code and job title (backend §1). */
  search?: string;
  departmentId?: string | number | null;
  status?: string | null;
  /** Includes archived rows alongside active ones (backend §3.4). */
  includeArchived?: boolean;
};

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

/**
 * One page of `/api/hr/employees/list`.
 *
 * `page`/`perPage`/`totalPages` are now always echoed back by the backend, even
 * for `offset`-based callers (backend §2) — but they are still defaulted here so
 * a deployment that predates that change degrades to a single usable page
 * instead of rendering a pager with `NaN` in it.
 */
export type EmployeeListPage = {
  items: DbEmployee[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

type RawEmployeeListPage = {
  items?: unknown[];
  total?: number;
  page?: number;
  per_page?: number;
  limit?: number;
  total_pages?: number;
};

export const DEFAULT_EMPLOYEE_PAGE_SIZE = 25;

/**
 * Server-paginated roster for the employee list screen. `fetchEmployees` above
 * stays the full-roster fetch that dropdowns, the kanban board and the other
 * screens share — this one is deliberately separate so paging the table never
 * shrinks the manager/department option lists those depend on.
 */
export const fetchEmployeesPage = async (params: EmployeeListParams = {}): Promise<EmployeeListPage> => {
  const limit = params.limit ?? DEFAULT_EMPLOYEE_PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);
  const body: Record<string, unknown> = { limit, page };
  const search = params.search?.trim();
  if (search) body.search = search;
  if (params.departmentId != null && params.departmentId !== "") body.department_id = eid(params.departmentId);
  if (params.status) body.status = params.status;
  if (params.includeArchived) body.include_archived = true;

  const data = await hrCall<RawEmployeeListPage | unknown[]>("/api/hr/employees/list", body);
  const rows = Array.isArray(data) ? data : (data?.items ?? []);
  const raw = Array.isArray(data) ? {} : (data ?? {});
  const total = raw.total ?? rows.length;
  const perPage = raw.per_page ?? raw.limit ?? limit;
  return {
    items: rows.map(mapEmployee),
    total,
    page: raw.page ?? page,
    perPage,
    totalPages: raw.total_pages ?? (perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1),
  };
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
