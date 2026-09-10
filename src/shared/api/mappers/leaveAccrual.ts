/**
 * `/api/hr/leave/balances` and `/api/hr/leave/accruals` mappers — split out of
 * `leave.ts` so neither file outgrows the 300-line limit.
 */
import type { DbLeaveBalance, DbLeaveBalanceItem, DbLeaveBalanceSummary, DbLeaveAccrualEntry, DbLeaveAccrualHistory, DbAccrualExcludedEmployee, DbAccrualExcludedList } from "../../hooks";
import { sid, sornull, num, bool, empty } from "./mapHelpers";

export const mapLeaveBalance = (r: any): DbLeaveBalance => {
  return {
    id: sid(r.id || `${r.employee_id}-${r.leave_type_id}-${r.year}`),
    employee_id: sid(r.employee_id),
    leave_type: r.leave_type_name || r.leave_type || "",
    leave_type_id: sornull(r.leave_type_id),
    year: num(r.year),
    total_days: num(r.total_days ?? r.max_leaves),
    used_days: num(r.used_days ?? r.used ?? r.leaves_taken),
    carryover_days: num(r.carryover_days),
    accrued_days: num(r.accrued_days ?? r.accrued),
    // `remaining` already nets off pending requests (Odoo virtual_remaining_leaves),
    // so it is the authoritative "available" figure — not total + accrued − used.
    remaining_days: num(r.remaining ?? r.remaining_days),
    blocked_by_probation: bool(r.blocked_by_probation),
    can_apply: r.can_apply !== false,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

/** One `items[]` entry of `/api/hr/leave/balances` (backend §1). */
export const mapLeaveBalanceItem = (r: any): DbLeaveBalanceItem => {
  const annualEntitlement = num(r.annual_entitlement);
  return {
    leave_type_id: sid(r.leave_type_id),
    leave_type_name: r.leave_type_name || r.leave_type || "",
    max_leaves: num(r.max_leaves),
    remaining: num(r.remaining),
    requires_allocation: bool(r.requires_allocation),
    accrual_enabled: bool(r.accrual_enabled),
    // Absent on a backend that predates v1.17.0 → the base was the whole entitlement.
    base_annual_entitlement: num(r.base_annual_entitlement, annualEntitlement),
    additional_annual_leave: num(r.additional_annual_leave),
    annual_entitlement: annualEntitlement,
    monthly_accrual: num(r.monthly_accrual),
    accrued: num(r.accrued),
    accrual_periods: num(r.accrual_periods),
    used: num(r.used ?? (num(r.max_leaves) - num(r.remaining))),
    blocked_by_probation: bool(r.blocked_by_probation),
    blocked_by_min_service: bool(r.blocked_by_min_service),
    min_service_months: num(r.min_service_months),
    min_service_eligible_from: r.min_service_eligible_from || null,
    // Absent on a backend that predates v1.12.9 → treat the type as appliable.
    can_apply: r.can_apply !== false,
    // Year-end balance policy (backend v1.21.0). Absent → "accumulate", the
    // behaviour those backends had. `leave_year_end` is the day the balance
    // resets on when `balance_resets_yearly` is true.
    balance_reset_policy: r.balance_reset_policy === "reset_yearly" ? "reset_yearly" : "accumulate",
    balance_resets_yearly: bool(r.balance_resets_yearly),
    leave_year_start: r.leave_year_start || null,
    leave_year_end: r.leave_year_end || null,
  };
}

/** Reference-only figure (backend §1) — `null` when absent or with no joining date. */
const yearsOfService = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

export const mapLeaveBalanceSummary = (r: any): DbLeaveBalanceSummary => {
  const rows = Array.isArray(r) ? r : r?.items || r?.balances || [];
  return {
    employee_id: sid(r?.employee_id),
    joining_date: r?.joining_date || null,
    probation: bool(r?.probation),
    probation_end_date: r?.probation_end_date || null,
    accrual_excluded: bool(r?.accrual_excluded),
    accrual_excluded_reason: r?.accrual_excluded_reason || null,
    years_of_service: yearsOfService(r?.years_of_service),
    items: rows.map(mapLeaveBalanceItem),
  };
}

export const mapAccrualExcludedEmployee = (r: any): DbAccrualExcludedEmployee => {
  return {
    employee_id: sid(r.employee_id),
    employee_name: r.employee_name || "",
    employee_code: r.employee_code || "",
    department_id: sornull(r.department_id),
    department_name: r.department_name || "",
    hr_status: r.hr_status || "",
    reason: r.reason || "",
  };
}

export const mapAccrualExcludedList = (r: any): DbAccrualExcludedList => {
  const rows = Array.isArray(r) ? r : r?.items || [];
  return {
    total: num(r?.total ?? rows.length),
    items: rows.map(mapAccrualExcludedEmployee),
  };
}

export const mapLeaveAccrualEntry = (r: any): DbLeaveAccrualEntry => {
  return {
    id: sid(r.id),
    leave_type_id: sid(r.leave_type_id),
    leave_type_name: r.leave_type_name || "",
    period_date: r.period_date || "",
    period_sequence: num(r.period_sequence),
    days: num(r.days),
    state: r.state || "",
    name: r.name || "",
  };
}

export const mapLeaveAccrualHistory = (r: any): DbLeaveAccrualHistory => {
  const rows = Array.isArray(r) ? r : r?.items || [];
  const items = rows.map(mapLeaveAccrualEntry);
  return {
    employee_id: sid(r?.employee_id),
    joining_date: r?.joining_date || null,
    probation: bool(r?.probation),
    probation_end_date: r?.probation_end_date || null,
    accrual_excluded: bool(r?.accrual_excluded),
    accrual_excluded_reason: r?.accrual_excluded_reason || null,
    years_of_service: yearsOfService(r?.years_of_service),
    items,
    total_days: num(r?.total_days ?? items.reduce((sum: number, item: DbLeaveAccrualEntry) => sum + item.days, 0)),
  };
}
