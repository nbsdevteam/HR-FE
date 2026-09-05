/**
 * Annual-leave accrual and probation (backend `lugal_hr` v1.12.9) — the
 * `/leave/balances` envelope and the `/leave/accruals` audit trail. Split out
 * of `leave.ts` so neither file outgrows the 300-line limit.
 */
import * as odooData from "@/shared/api/odooData";
import { useCachedList } from "./core";

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
  /**
   * Reference only (backend v1.17.0 §1) — `null` when there's no joining
   * date. Never use this to compute or suggest a day count; HR decides
   * Additional Annual Leave grants manually.
   */
  years_of_service: number | null;
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
  /** The Settings value alone (backend v1.17.0 §1) — was `annual_entitlement` before Additional Annual Leave existed. */
  base_annual_entitlement: number;
  /** Sum of this employee's active, already-effective grants for this leave type. `0` if none. */
  additional_annual_leave: number;
  /** `base_annual_entitlement + additional_annual_leave`. */
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
  const enabled = options?.enabled !== false;

  // Cache-key/query-key identity (rather than a manual request-id guard)
  // handles an earlier, slower response for a previously selected employee
  // landing after the current one — react-query discards it on its own.
  const { data, loading, error, refetch } = useCachedList<DbLeaveBalanceSummary>(
    "leaveBalanceSummary",
    async () => [await odooData.fetchLeaveBalanceSummary(employeeId ?? undefined)],
    "Failed to load leave balances",
    [employeeId ?? null],
    enabled,
  );

  return { summary: data[0] ?? null, loading, error, refetch };
}

/** Monthly accrual history (`/api/hr/leave/accruals`) for one employee. */
export const useLeaveAccruals = (
  employeeId?: string | null,
  options?: { leaveTypeId?: string | null; limit?: number },
) => {
  const leaveTypeId = options?.leaveTypeId ?? null;
  const limit = options?.limit;

  const { data, loading, error, refetch } = useCachedList<DbLeaveAccrualHistory>(
    "leaveAccruals",
    async () => [
      await odooData.fetchLeaveAccruals({
        employeeId: employeeId ?? undefined,
        leaveTypeId: leaveTypeId ?? undefined,
        limit,
      }),
    ],
    "Failed to load accrual history",
    [employeeId ?? null, leaveTypeId, limit],
  );

  return { history: data[0] ?? null, loading, error, refetch };
}
