import type { DbAttendanceRecord, DbMonthlyRecord, DbMonthlyLedger } from "../../hooks";
import { odooUtcNaiveToBaghdadTime } from "@/shared/utils/timezone";
import { sid, num, bool, sornull, empty } from "./mapHelpers";

/**
 * Odoo attendance Datetime is UTC-naive. Map to Asia/Baghdad wall-clock HH:MM:SS
 * for all HR UI / payroll / report consumers of DbAttendanceRecord times.
 */
function timeFromDt(dt: string | null | undefined): string | null {
  return odooUtcNaiveToBaghdadTime(dt);
}

export const mapAttendance = (r: any): DbAttendanceRecord => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    employee_name: r.employee_name || "",
    date: r.date || "",
    day_of_week: r.day_of_week || "",
    check_in_time: timeFromDt(r.check_in) || timeFromDt(r.check_in_time) || null,
    check_out_time: timeFromDt(r.check_out) || timeFromDt(r.check_out_time) || null,
    working_hours: num(r.worked_hours ?? r.working_hours),
    overtime_hours: num(r.overtime_hours),
    is_late: bool(r.is_late),
    late_minutes: num(r.late_minutes),
    is_early: bool(r.is_early),
    status: r.status || "",
    created_at: r.created_at || empty,
    auto_checkout_applied: bool(r.auto_checkout_applied),
    source: r.source || null,
    verify_mode: r.verify_mode || null,
    device_employee_no: r.device_employee_no || null,
    device_id: sornull(r.device_id),
    excused_late: bool(r.excused_late),
    excused_absence: bool(r.excused_absence),
    excused_shortfall: bool(r.excused_shortfall),
    excuse_note: r.excuse_note || null,
    excused_by: r.excused_by || null,
    excused_at: r.excused_at || null,
  };
}

export const mapMonthlyRecord = (r: any): DbMonthlyRecord => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    month_year: r.month_year || "",
    imported_at: r.imported_at || empty,
    salary_calculation: r.salary_calculation || {},
  };
}

export const mapMonthlyLedger = (r: any): DbMonthlyLedger => {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    month_year: r.month_year || "",
    grace_consumed_minutes: num(r.grace_consumed_minutes),
    chargeable_late_minutes: num(r.chargeable_late_minutes),
    absence_days: r.absence_days || null,
    loan_by_currency: r.loan_by_currency || {},
    tip_by_currency: r.tip_by_currency || {},
    penalty_by_currency: r.penalty_by_currency || {},
    notes: r.notes || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}
