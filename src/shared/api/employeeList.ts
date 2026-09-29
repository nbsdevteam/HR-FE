import { hrCall } from "./client";
import { mapEmployee } from "./mappers";
import { eid } from "./httpHelpers";
import type { DbEmployee, DeviceEnrollmentState, EmployeeStatusCode } from "../hooks";

export type EmployeeListParams = {
  /** 1-based. The backend derives `offset` as `(page - 1) * limit` (backend §1). */
  page?: number;
  limit?: number;
  /** OR-ilike across name, work email, employee code and job title (backend §1). */
  search?: string;
  departmentId?: string | number | null;
  status?: EmployeeStatusCode | (string & {}) | null;
  /** Includes archived rows alongside active ones (backend §3.4). */
  includeArchived?: boolean;
  /** Filter by enrolment state — `pending`/`partial`/`failed`/etc (backend §7/§8). */
  deviceEnrollmentState?: DeviceEnrollmentState[] | null;
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
 * Server-paginated roster for the employee list screen. `fetchEmployees`
 * (`./core`) stays the full-roster fetch that dropdowns, the kanban board and
 * the other screens share — this one is deliberately separate so paging the
 * table never shrinks the manager/department option lists those depend on.
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
  if (params.deviceEnrollmentState?.length) body.device_enrollment_state = params.deviceEnrollmentState;

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
