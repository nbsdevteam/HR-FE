import { hrCall } from "./client";
import { mapEmployee, mapDepartment } from "./mappers";
import type { DbEmployee, DbDepartment } from "../hooks";
import { items, eid } from "./httpHelpers";

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
  return rows.map(mapDepartment);
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

export const createDepartment = async (payload: Record<string, unknown>) => {
  return hrCall("/api/hr/departments/create", payload);
}

export const linkEmployeesToUsers = async (dry_run = true, employee_ids?: number[]) => {
  return hrCall("/api/hr/employees/link_users", { dry_run, employee_ids });
}
