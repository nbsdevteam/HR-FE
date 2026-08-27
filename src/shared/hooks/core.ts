import { useCallback, type DependencyList } from "react";
import * as odooData from "@/shared/api/odooData";
import { useAsyncList } from "./useAsyncList";

/**
 * Thin wrapper over `useAsyncList` for the common case of "fetch a list,
 * expose it under a resource-specific name". Collapses the repeated
 * `const {data: x, loading, refetch} = useAsyncList(...); return {x, loading, refetch}`
 * shape duplicated across the domain hook files (lifecycle.ts, payroll.ts,
 * performance.ts, etc.) into one call.
 */
export const useCachedList = <T,>(
  cacheKey: string,
  fetcher: () => Promise<T[]>,
  errorFallback = "Failed to load data",
  deps: DependencyList = [],
) => {
  const { data, loading, error, refetch } = useAsyncList(fetcher, deps, errorFallback, undefined, {
    cacheKey,
  });
  return { data, loading, error, refetch };
};

// ——— Raw DB types ———

/** The backend returns `address` as a structured object, not a flat string.
 *  `residence` is the canonical street line; `street` carries the same value
 *  for legacy readers. `country`/`state`/`city` are display names — writes
 *  must send `country_id`/`state_id`/`city_id` (or a name, which the backend
 *  resolves) instead. `city_id` is `false` for a free-text city saved before
 *  the city master-data link existed. */
export interface DbEmployeeAddress {
  country?: string;
  country_id?: string | number | false;
  state?: string;
  state_id?: string | number | false;
  city?: string;
  city_id?: string | number | false;
  residence?: string;
  street?: string;
  street2?: string;
  zip?: string;
}

export interface DbEmployee {
  id: string;
  person_id: number;
  name: string;
  arabic_name: string;
  department: string;
  department_id: string | null;
  monthly_salary: number;
  currency: string;
  overtime_rate: number;
  overtime_enabled: boolean;
  allowed_late_minutes: number;
  profile_picture: string | null;
  position: string | null;
  email: string | null;
  personal_phone: string | null;
  company_phone: string | null;
  join_date: string | null;
  end_date: string | null;
  status: string | null;
  address: string | null;
  /** Raw address record from the backend — kept so an update can preserve
   *  street2/city/zip/state/country instead of clobbering them with just the
   *  flattened display string. */
  address_raw: DbEmployeeAddress | string | null;
  /** "local" | "remote" | "" (unset) */
  work_location: string;
  national_id: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  blood_type: string | null;
  manager_id: string | null;
  shift_id: string | null;
  position_id: string | null;
  direct_manager_id: string | null;
  device_employee_no: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbDepartment {
  id: string;
  legacy_id: string;
  name: string;
  /** Raw English name — kept separate from `name` (which prefers Arabic) for the org-structure management form. */
  name_en: string;
  name_ar: string | null;
  complete_name: string;
  color: string;
  description: string | null;
  manager_id: string | null;
  default_shift_id: string | null;
  parent_id: string | null;
  parent_name: string | null;
  sort_order: number;
  employee_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** One node of the `/api/hr/departments/tree` org chart (backend §3). */
export interface DepartmentTreeNode extends DbDepartment {
  children: DepartmentTreeNode[];
  total_employee_count: number;
}

export interface DepartmentTreeResult {
  items: DepartmentTreeNode[];
  total: number;
  unassignedEmployeeCount: number;
}

/** Form choices + `can_manage`/`can_create`/`can_edit`/`can_delete` for the org-structure admin screen (backend §7). */
export interface DepartmentMetadata {
  shifts: { value: string; label: string }[];
  canManage: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// ——— Hooks ———

export const useEmployees = () => {
  const { data: employees, loading, error, refetch } = useAsyncList(
    () => odooData.fetchEmployees(),
    [],
    "Failed to load employees",
    undefined,
    { cacheKey: "employees" }
  );
  return { employees, loading, error, refetch };
}

export const useDepartments = () => {
  const { data: departments, loading, error, refetch } = useAsyncList(
    () => odooData.fetchDepartments(),
    [],
    "Failed to load departments",
    undefined,
    { cacheKey: "departments" }
  );
  return { departments, loading, error, refetch };
}

/** Form choices + `can_manage` for the org-structure admin screen (backend §7). */
export const useDepartmentMetadata = () => {
  const { data, loading, refetch } = useCachedList(
    "departmentMetadata",
    async () => [await odooData.fetchDepartmentMetadata()],
    "Failed to load department metadata",
  );
  return { metadata: data[0] ?? null, loading, refetch };
}

/**
 * Employees + departments together. Composes the two cached list hooks rather
 * than issuing its own pair of fetches, so a page that also calls
 * `useEmployees()` elsewhere reuses the same in-flight request.
 */
export const useHierarchyData = () => {
  const { employees, loading: employeesLoading, refetch: refetchEmployees } = useEmployees();
  const { departments, loading: departmentsLoading, refetch: refetchDepartments } = useDepartments();

  const refetch = useCallback(async () => {
    await Promise.all([refetchEmployees(), refetchDepartments()]);
  }, [refetchEmployees, refetchDepartments]);

  return {
    employees,
    departments,
    loading: employeesLoading || departmentsLoading,
    refetch,
  };
}

// ——— Helpers ———

/** Map DB employee ID to a friendly EMP-XXXX number */
export const empNumber = (personId: number): string => {
  return `EMP-${String(personId).padStart(4, "0")}`;
}

/** Get display name — prefer real Arabic/English names over login-style usernames. */
export const empDisplayName = (e: DbEmployee): string => {
  const ar = (e.arabic_name || "").trim();
  const en = (e.name || "").trim();
  const looksLikeLogin = (s: string) =>
    /^[a-z0-9._-]+$/i.test(s) && (s.includes(".") || s.includes("_"));
  if (ar && /[\u0600-\u06FF]/.test(ar)) return ar;
  if (en && !looksLikeLogin(en)) return en;
  if (ar) return ar;
  if (en) return en;
  return "—";
}
