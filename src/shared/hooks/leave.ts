import { useState, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import { useAsyncList } from "./useAsyncList";
import type { DbEmployee } from "./core";

// ——— Phase 3: Leave Management Types ———

export interface DbLeaveType {
  id: string;
  name_ar: string;
  name_en: string | null;
  code: string;
  is_paid: boolean;
  default_days_per_year: number;
  max_days_per_request: number | null;
  min_days_per_request: number;
  allow_half_day: boolean;
  requires_attachment: boolean;
  attachment_after_days: number | null;
  gender_restriction: string | null;
  min_service_months: number;
  is_carryover_allowed: boolean;
  max_carryover_days: number;
  carryover_expiry_months: number;
  is_encashable: boolean;
  encashment_percentage: number;
  accrual_method: string;
  color: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbLeavePolicy {
  id: string;
  leave_type_id: string;
  scope: string;
  scope_value: string | null;
  days_per_year: number;
  max_days_per_request: number | null;
  allow_half_day: boolean | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbLeaveAccrual {
  id: string;
  employee_id: string;
  leave_type_id: string;
  year: number;
  month: number;
  accrued_days: number;
  created_at: string;
}

export interface DbLeavePermission {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  hours: number;
  reason: string | null;
  status: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbLeaveBalance {
  id: string;
  employee_id: string;
  leave_type: string;
  leave_type_id: string | null;
  year: number;
    total_days: number;
    entitlement_days?: number;
  used_days: number;
  carryover_days: number;
  accrued_days: number;
  created_at: string;
  updated_at: string;
}

export interface DbLeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  leave_type_id: string | null;
  start_date: string;
  end_date: string;
  days: number;
  is_half_day: boolean;
  half_day_period: string | null;
  reason: string | null;
  status: string;
  approved_by: string | null;
  rejection_reason: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Employee roster for Leave pages (HR APIs only — no /api/crm permission probe).
 * - hr.employees.list succeeds → full roster dropdown
 * - list Forbidden → /api/hr/employees/me + selfOnly (agent self-leave)
 */
export const useLeaveEmployeeScope = () => {
  const [employees, setEmployees] = useState<DbEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selfOnly, setSelfOnly] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    setLinkError(null);
    try {
      const scope = await odooData.resolveLeaveEmployeeScope();
      setSelfOnly(scope.selfOnly);
      setEmployees(scope.employees);
      setLinkError(scope.linkError);
    } catch (e: any) {
      setError(e?.message || "Failed to load employees");
      setSelfOnly(false);
      setEmployees([]);
      setLinkError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  return {
    employees,
    loading,
    error,
    selfOnly,
    linkError,
    refetch: fetch,
  };
}

export const useLeaveTypes = () => {
  const { data: types, loading, refetch } = useAsyncList(() => odooData.fetchLeaveTypes());
  return { types, loading, refetch };
}

export const useLeavePolicies = () => {
  const { data: policies, loading, refetch } = useAsyncList(() => odooData.fetchLeavePolicies());
  return { policies, loading, refetch };
}

export const useLeaveRequests = (filters?: { employeeId?: string; status?: string; month?: string }) => {
  const { data: requests, loading, refetch } = useAsyncList(
    () => odooData.fetchLeaveRequests(filters),
    [filters?.employeeId, filters?.status, filters?.month]
  );
  return { requests, loading, refetch };
}

export const useLeaveBalances = (year?: number) => {
  const { data: balances, loading, refetch } = useAsyncList(
    () => odooData.fetchLeaveBalances(year),
    [year]
  );
  return { balances, loading, refetch };
}

export const useLeavePermissions = (employeeId?: string) => {
  const { data: permissions, loading, refetch } = useAsyncList(
    () => odooData.fetchLeavePermissions(employeeId),
    [employeeId]
  );
  return { permissions, loading, refetch };
}

/** Resolve effective leave days for an employee considering policies (department/contract overrides) */
export const resolveLeaveEntitlement = (
  leaveType: DbLeaveType,
  policies: DbLeavePolicy[],
  department?: string,
  contractType?: string
): number => {
  // Priority: contract_type > department > global > default
  const contractPolicy = policies.find(p => p.leave_type_id === leaveType.id && p.scope === "contract_type" && p.scope_value === contractType);
  if (contractPolicy) return contractPolicy.days_per_year;
  const deptPolicy = policies.find(p => p.leave_type_id === leaveType.id && p.scope === "department" && p.scope_value === department);
  if (deptPolicy) return deptPolicy.days_per_year;
  const globalPolicy = policies.find(p => p.leave_type_id === leaveType.id && p.scope === "global");
  if (globalPolicy) return globalPolicy.days_per_year;
  return leaveType.default_days_per_year;
}
