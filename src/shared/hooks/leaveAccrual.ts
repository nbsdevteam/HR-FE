/**
 * Annual-leave accrual and probation (backend `lugal_hr` v1.12.9) — the
 * `/leave/balances` envelope and the `/leave/accruals` audit trail. Split out
 * of `leave.ts` so neither file outgrows the 300-line limit.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import * as odooData from "@/shared/api/odooData";

/** Probation envelope shared by `/leave/balances` and `/leave/accruals` (backend §3). */
export interface DbLeaveProbationInfo {
  joining_date: string | null;
  /** Whether the employee is on probation **today** — the request gate uses the leave start date. */
  probation: boolean;
  /** Last day of probation, inclusive. */
  probation_end_date: string | null;
  /** True when the employee is skipped by accrual entirely (e.g. no joining date) — show `accrual_excluded_reason` instead of a `0` balance. */
  accrual_excluded: boolean;
  accrual_excluded_reason: string | null;
}

/** One leave type inside the `/leave/balances` envelope (backend §1). */
export interface DbLeaveBalanceItem {
  leave_type_id: string;
  leave_type_name: string;
  max_leaves: number;
  /** Allocated − taken − pending. This is the number to show as "available". */
  remaining: number;
  requires_allocation: boolean;
  accrual_enabled: boolean;
  annual_entitlement: number;
  monthly_accrual: number;
  accrued: number;
  /** How many monthly grants exist. Meaningful only when `accrual_enabled`. */
  accrual_periods: number;
  used: number;
  blocked_by_probation: boolean;
  can_apply: boolean;
}

export interface DbLeaveBalanceSummary extends DbLeaveProbationInfo {
  employee_id: string;
  items: DbLeaveBalanceItem[];
}

/** One row of `POST /api/hr/leave/accrual-excluded` (HR-only, backend §6). */
export interface DbAccrualExcludedEmployee {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_id: string | null;
  department_name: string;
  hr_status: string;
  reason: string;
}

export interface DbAccrualExcludedList {
  total: number;
  items: DbAccrualExcludedEmployee[];
}

/** One monthly accrual grant — the audit trail behind `accrued` (backend §2). */
export interface DbLeaveAccrualEntry {
  id: string;
  leave_type_id: string;
  leave_type_name: string;
  /** Completion date of the service month — the date the grant is credited. */
  period_date: string;
  /** 1 = first completed month of service, 2 = second, … */
  period_sequence: number;
  days: number;
  /** Odoo allocation state; `"validate"` means it counts toward the balance. */
  state: string;
  name: string;
}

export interface DbLeaveAccrualHistory extends DbLeaveProbationInfo {
  employee_id: string;
  /** Newest period first. */
  items: DbLeaveAccrualEntry[];
  total_days: number;
}

/**
 * Full `/api/hr/leave/balances` envelope for one employee — accrual figures and
 * the probation window alongside the per-type balances. A single object rather
 * than a list, so it doesn't fit `useCachedList`'s `T[]` contract.
 *
 * Pass `null`/`undefined` to read the caller's own balances: the employee_id
 * param is only sent when it is given, because sending it requires approver
 * rights the signed-in agent may not have.
 */
export const useLeaveBalanceSummary = (
  employeeId?: string | null,
  options?: { enabled?: boolean },
) => {
  const [summary, setSummary] = useState<DbLeaveBalanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guards against an earlier, slower response for a previously selected
  // employee landing after the current one and overwriting it.
  const requestRef = useRef(0);

  const enabled = options?.enabled !== false;

  const fetch = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    if (!enabled) {
      setSummary(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await odooData.fetchLeaveBalanceSummary(employeeId ?? undefined);
      if (requestRef.current !== requestId) return;
      setSummary(data);
    } catch (e: any) {
      if (requestRef.current !== requestId) return;
      setError(e?.message || "Failed to load leave balances");
      setSummary(null);
    }
    if (requestRef.current === requestId) setLoading(false);
  }, [employeeId, enabled]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { summary, loading, error, refetch: fetch };
}

/** Monthly accrual history (`/api/hr/leave/accruals`) for one employee. */
export const useLeaveAccruals = (
  employeeId?: string | null,
  options?: { leaveTypeId?: string | null; limit?: number },
) => {
  const [history, setHistory] = useState<DbLeaveAccrualHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestRef = useRef(0);
  const leaveTypeId = options?.leaveTypeId ?? null;
  const limit = options?.limit;

  const fetch = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setError(null);
    try {
      const data = await odooData.fetchLeaveAccruals({
        employeeId: employeeId ?? undefined,
        leaveTypeId: leaveTypeId ?? undefined,
        limit,
      });
      if (requestRef.current !== requestId) return;
      setHistory(data);
    } catch (e: any) {
      if (requestRef.current !== requestId) return;
      setError(e?.message || "Failed to load accrual history");
      setHistory(null);
    }
    if (requestRef.current === requestId) setLoading(false);
  }, [employeeId, leaveTypeId, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { history, loading, error, refetch: fetch };
}
