/**
 * Types for the server-driven Payroll API (`/api/hr/payroll/metadata`,
 * `/api/hr/payroll/list`, `/api/hr/payroll/employee/<id>`).
 *
 * Generated from `Payroll FE Handoff.md` §18 — the backend computes gross/net
 * salary server-side now; these types describe what it sends back, not a
 * client-side calculation shape (that lives in `@/features/payroll`'s
 * `payslip-types.ts` as a view-model consumed by the detail panel).
 */

export type PayrollStatus = "draft" | "generated";

export interface PayrollListRequest {
  month?: string;
  page?: number;
  limit?: number;
  offset?: number;
  search?: string;
  department_id?: number | null;
  employee_id?: number | null;
  status?: PayrollStatus | null;
  include_totals?: boolean;
}

export interface PayrollEmployeeDetailRequest {
  month?: string;
}

export interface PayslipGenerateRequest {
  month: string;
  employee_ids?: number[];
  replace_month?: boolean;
}

export interface PayrollRow {
  employee_id: number;
  employee_name: string;
  employee_name_ar: string;
  employee_code: string;
  department_id: number | false;
  department_name: string;
  designation_name: string;
  month: string;
  currency: string;
  basic_salary: number;

  scheduled_working_days: number;
  holiday_days: number;
  days_worked: number;
  absent_days: number;
  absence_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  late_days: number;
  early_days: number;
  missing_checkout_days: number;
  total_hours: number;
  overtime_hours: number;
  shortfall_hours: number;
  chargeable_late_hours: number;
  target_hours_per_day: number;
  absence_divisor: number;

  total_allowances: number;
  total_statutory_deductions: number;
  loan_installment: number;
  ledger_loan: number;
  ledger_tip: number;
  ledger_penalty: number;
  adjustments: number;
  overtime_payment: number;
  late_deduction: number;
  shortfall_deduction: number;
  absence_deduction: number;
  gross_salary: number;
  net_salary: number;
  total_with_overtime: number;
  total_without_overtime: number;

  status: PayrollStatus;
  payslip_id: number | false;
  generated_at: string | null;
}

export interface PayrollPagination {
  total: number;
  count: number;
  limit: number;
  offset: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  next_offset: number | null;
  prev_offset: number | null;
}

export interface PayrollTotals {
  employees: number;
  basic_salary: number;
  gross_salary: number;
  net_salary: number;
  total_allowances: number;
  total_deductions: number;
  generated: number;
  draft: number;
}

export interface PayrollListResponse {
  items: PayrollRow[];
  total: number;
  limit: number;
  offset: number;
  page: number;
  per_page: number;
  pagination: PayrollPagination;
  month: string;
  filters: {
    search: string | null;
    department_id: number | null;
    employee_id: number | null;
    status: PayrollStatus | null;
  };
  totals?: PayrollTotals;
}

export type PayrollDayStatus =
  | "present" | "late" | "absent" | "absent_excused"
  | "leave_paid" | "leave_unpaid" | "holiday";

export interface PayrollDayRow {
  date: string;
  status: PayrollDayStatus;
  worked_hours: number;
  overtime_hours: number;
  late_minutes: number;
  shortfall_hours: number;
  leave_type_name?: string | null;
}

export interface PayrollAttendanceSummary {
  scheduled_working_days: number;
  holiday_days: number;
  days_worked: number;
  absent_days: number;
  absence_days: number;
  absence_dates: string[];
  late_days: number;
  early_days: number;
  missing_checkout_days: number;
  total_hours: number;
  overtime_hours: number;
  shortfall_hours: number;
  chargeable_late_hours: number;
  target_hours_per_day: number;
  days: PayrollDayRow[];
}

export interface PayrollLeaveRequestRow {
  leave_id: number;
  leave_type_id: number;
  leave_type_name: string;
  leave_type_name_ar: string;
  is_paid: boolean;
  is_half_day: boolean;
  date_from: string | null;
  date_to: string | null;
  number_of_days: number;
}

export interface PayrollAllowanceLine {
  id: number;
  allowance_type_id: number;
  name: string;
  name_ar: string;
  amount: number;
  currency: string;
}

export interface PayrollDeductionLine {
  id: number;
  deduction_type_id: number;
  name: string;
  name_ar: string;
  amount: number;
  percentage: number;
  calc_method: string;
  percentage_of: string;
  currency: string;
}

export interface PayrollDetailEmployee {
  id: number;
  name: string;
  employee_code?: string;
  monthly_salary?: number;
  currency?: string;
  department_id?: number | false;
  shift_id?: number | false;
  joining_date?: string | null;
  [key: string]: unknown;
}

export interface PayrollDetailLoan {
  id: number;
  loan_amount: number;
  installment_amount: number;
  currency: string;
  status: string;
  [key: string]: unknown;
}

export interface PayrollDetailLedger {
  id: number;
  month: string;
  loan_by_currency?: Record<string, number>;
  tip_by_currency?: Record<string, number>;
  penalty_by_currency?: Record<string, number>;
  absence_days?: string[];
  notes?: string;
  [key: string]: unknown;
}

export interface PayrollDetailPayslip {
  id: number;
  month: string;
  net_salary: number;
  [key: string]: unknown;
}

export interface PayrollEmployeeDetailResponse {
  month: string;
  employee: PayrollDetailEmployee;
  calculation: PayrollRow;
  attendance: PayrollAttendanceSummary;
  leave: {
    paid_leave_days: number;
    unpaid_leave_days: number;
    requests: PayrollLeaveRequestRow[];
  };
  allowances: PayrollAllowanceLine[];
  deductions: PayrollDeductionLine[];
  loans: PayrollDetailLoan[];
  ledger: PayrollDetailLedger | null;
  payslip: PayrollDetailPayslip | null;
  monthly_record: Record<string, unknown> | null;
}

export interface PayrollMetadataResponse {
  departments: Array<Record<string, unknown>>;
  shifts: Array<Record<string, unknown>>;
  allowance_types: Array<Record<string, unknown>>;
  deduction_types: Array<Record<string, unknown>>;
  leave_types: Array<Record<string, unknown>>;
  configs: Array<Record<string, unknown>>;
  currencies: Array<{ code: string; label: string }>;
  statuses: PayrollStatus[];
  available_months: string[];
  current_month: string;
  page_limits: { default: number; max: number };
  unavailable: string[];
}
