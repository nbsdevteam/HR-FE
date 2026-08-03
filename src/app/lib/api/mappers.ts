/**
 * Map Odoo /api/hr JSON → existing Db* shapes used by pages/hooks.
 */
import type {
  DbEmployee,
  DbDepartment,
  DbAttendanceRecord,
  DbMonthlyRecord,
  DbMonthlyLedger,
  DbShift,
  DbPosition,
  DbEmployeeShiftAssignment,
  DbSystemModule,
  DbConfiguration,
  DbPublicHoliday,
  DbLeaveType,
  DbLeavePolicy,
  DbLeaveRequest,
  DbLeaveBalance,
  DbLeavePermission,
  DbAllowanceType,
  DbEmployeeAllowance,
  DbDeductionType,
  DbEmployeeDeduction,
  DbDocumentType,
  DbEmployeeDocument,
} from "../hooks";

const sid = (v: unknown) => (v === null || v === undefined || v === false ? "" : String(v));
const sornull = (v: unknown) => (v === null || v === undefined || v === false || v === "" ? null : String(v));
const num = (v: unknown, d = 0) => (typeof v === "number" ? v : Number(v) || d);
const bool = (v: unknown) => Boolean(v);
const empty = "";

function timeFromDt(dt: string | null | undefined): string | null {
  if (!dt) return null;
  const part = String(dt).includes(" ") ? String(dt).split(" ")[1] : String(dt);
  return part?.slice(0, 8) || null;
}

function hhmmFromFloatOrLabel(v: unknown, label?: unknown): string {
  if (typeof label === "string" && label) {
    return label.length === 5 ? `${label}:00` : label;
  }
  if (typeof v === "number") {
    const h = Math.floor(v);
    const m = Math.round((v - h) * 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
  }
  return "08:00:00";
}

export function mapEmployee(r: any): DbEmployee {
  const address =
    typeof r.address === "string"
      ? r.address
      : r.address
        ? [r.address.street, r.address.street2, r.address.city].filter(Boolean).join(", ")
        : null;
  return {
    id: sid(r.id),
    person_id: num(r.person_id),
    name: r.name || "",
    arabic_name: r.arabic_name || "",
    department: r.department_name || r.department || "",
    monthly_salary: num(r.monthly_salary),
    currency: r.currency || "IQD",
    overtime_rate: num(r.overtime_rate),
    overtime_enabled: bool(r.overtime_enabled),
    allowed_late_minutes: num(r.allowed_late_minutes),
    profile_picture: r.photo || r.profile_picture || null,
    position: r.designation_name || r.position || null,
    email: r.email || null,
    personal_phone: r.personal_phone || r.phone || null,
    company_phone: r.company_phone || null,
    join_date: r.joining_date || r.join_date || null,
    end_date: r.end_date || null,
    status: r.status || null,
    address,
    national_id: r.identification_id || r.national_id || null,
    emergency_contact: r.emergency_contact || null,
    emergency_phone: r.emergency_phone || null,
    blood_type: r.blood_type || null,
    manager_id: sornull(r.manager_id),
    shift_id: sornull(r.shift_id),
    position_id: sornull(r.designation_id || r.position_id),
    direct_manager_id: sornull(r.manager_id || r.direct_manager_id),
    device_employee_no: r.device_employee_no || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapDepartment(r: any): DbDepartment {
  return {
    id: sid(r.id),
    name: r.name_ar || r.name || "",
    color: r.color || "#888888",
    description: r.description || null,
    manager_id: sornull(r.manager_id),
    default_shift_id: sornull(r.default_shift_id),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapAttendance(r: any): DbAttendanceRecord {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    date: r.date || "",
    day_of_week: r.day_of_week || "",
    check_in_time: timeFromDt(r.check_in) || r.check_in_time || null,
    check_out_time: timeFromDt(r.check_out) || r.check_out_time || null,
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

export function mapShift(r: any): DbShift {
  const start = hhmmFromFloatOrLabel(r.start_time, r.start_time_label || r.sunday_start);
  const end = hhmmFromFloatOrLabel(r.end_time, r.end_time_label || r.sunday_end);
  return {
    id: sid(r.id),
    name: r.name_ar || r.name || "",
    description: r.description || null,
    is_default: bool(r.is_default),
    grace_minutes: num(r.grace_minutes ?? r.grace_period_minutes),
    late_to_absent_hours: num(r.late_to_absent_hours, 3),
    target_hours_per_day: num(r.target_hours_per_day ?? r.working_hours, 8),
    sunday_is_working: bool(r.sunday_is_working ?? r.sunday_working),
    sunday_start: r.sunday_start || start,
    sunday_end: r.sunday_end || end,
    monday_is_working: bool(r.monday_is_working ?? r.monday_working),
    monday_start: r.monday_start || start,
    monday_end: r.monday_end || end,
    tuesday_is_working: bool(r.tuesday_is_working ?? r.tuesday_working),
    tuesday_start: r.tuesday_start || start,
    tuesday_end: r.tuesday_end || end,
    wednesday_is_working: bool(r.wednesday_is_working ?? r.wednesday_working),
    wednesday_start: r.wednesday_start || start,
    wednesday_end: r.wednesday_end || end,
    thursday_is_working: bool(r.thursday_is_working ?? r.thursday_working),
    thursday_start: r.thursday_start || start,
    thursday_end: r.thursday_end || end,
    friday_is_working: bool(r.friday_is_working ?? r.friday_working),
    friday_start: r.friday_start || start,
    friday_end: r.friday_end || end,
    saturday_is_working: bool(r.saturday_is_working ?? r.saturday_working),
    saturday_start: r.saturday_start || start,
    saturday_end: r.saturday_end || end,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapPosition(r: any): DbPosition {
  return {
    id: sid(r.id),
    title_ar: r.title_ar || r.name || "",
    title_en: r.name || r.title_en || null,
    department_id: sornull(r.department_id),
    reports_to_position_id: sornull(r.reports_to_job_id || r.reports_to_position_id),
    level: num(r.level),
    max_headcount: num(r.max_headcount),
    is_active: r.active !== false && r.is_active !== false,
    description: r.description || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapShiftAssignment(r: any): DbEmployeeShiftAssignment {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    shift_id: sid(r.shift_id),
    start_date: r.start_date || "",
    end_date: r.end_date || null,
    is_active: r.active !== false && r.is_active !== false,
    notes: r.notes || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapMonthlyRecord(r: any): DbMonthlyRecord {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    month_year: r.month_year || "",
    imported_at: r.imported_at || empty,
    salary_calculation: r.salary_calculation || {},
  };
}

export function mapMonthlyLedger(r: any): DbMonthlyLedger {
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

export function mapConfig(r: any): DbConfiguration {
  return {
    id: sid(r.id),
    config_key: r.config_key || "",
    config_value: r.config_value || "",
    value_type: r.value_type || "string",
    category: r.category || "",
    label_ar: r.label_ar || "",
    label_en: r.label_en || "",
    description_ar: r.description_ar || null,
    min_value: r.min_value ?? null,
    max_value: r.max_value ?? null,
    options: r.options || null,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapModule(r: any): DbSystemModule {
  return {
    id: sid(r.id),
    module_key: r.module_key || "",
    name_ar: r.name_ar || "",
    name_en: r.name_en || "",
    description_ar: r.description_ar || null,
    category: r.category || "",
    is_enabled: bool(r.is_enabled),
    icon: r.icon || null,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapHoliday(r: any): DbPublicHoliday {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name_en || r.name || null,
    date: r.date || "",
    year: num(r.year),
    is_recurring: bool(r.is_recurring),
    recurring_month: r.recurring_month ?? null,
    recurring_day: r.recurring_day ?? null,
    created_at: r.created_at || empty,
  };
}

export function mapLeaveType(r: any): DbLeaveType {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name || r.name_en || null,
    code: r.code || "",
    is_paid: r.is_paid !== false && !r.unpaid,
    default_days_per_year: num(r.default_days_per_year),
    max_days_per_request: r.max_days_per_request ?? null,
    min_days_per_request: num(r.min_days_per_request, 1),
    allow_half_day: bool(r.allow_half_day),
    requires_attachment: bool(r.requires_attachment),
    attachment_after_days: r.attachment_after_days ?? null,
    gender_restriction: r.gender_restriction || null,
    min_service_months: num(r.min_service_months),
    is_carryover_allowed: bool(r.is_carryover_allowed),
    max_carryover_days: num(r.max_carryover_days),
    carryover_expiry_months: num(r.carryover_expiry_months),
    is_encashable: bool(r.is_encashable),
    encashment_percentage: num(r.encashment_percentage),
    accrual_method: r.accrual_method || "yearly",
    color: r.color || "#888888",
    icon: r.icon || "",
    is_active: r.active !== false && r.is_active !== false,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

/** Map Odoo leave state → FE Arabic status labels where used. */
function mapLeaveStatus(state: string): string {
  const m: Record<string, string> = {
    draft: "مسودة",
    confirm: "قيد الانتظار",
    validate1: "موافقة المدير",
    validate: "مقبول",
    refuse: "مرفوض",
    cancel: "ملغي",
  };
  return m[state] || state || "";
}

export function mapLeaveRequest(r: any): DbLeaveRequest {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    leave_type: r.leave_type_name || r.leave_type || "",
    leave_type_id: sornull(r.leave_type_id),
    start_date: r.date_from || r.start_date || "",
    end_date: r.date_to || r.end_date || "",
    days: num(r.number_of_days ?? r.days),
    is_half_day: bool(r.half_day ?? r.is_half_day),
    half_day_period: r.half_day_period || null,
    reason: r.reason || null,
    status: mapLeaveStatus(r.state || r.status || ""),
    approved_by: r.approved_by || null,
    rejection_reason: r.rejection_reason || null,
    attachment_url: r.attachment_url || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapLeaveBalance(r: any): DbLeaveBalance {
  return {
    id: sid(r.id || `${r.employee_id}-${r.leave_type_id}-${r.year}`),
    employee_id: sid(r.employee_id),
    leave_type: r.leave_type_name || r.leave_type || "",
    leave_type_id: sornull(r.leave_type_id),
    year: num(r.year),
    total_days: num(r.total_days ?? r.max_leaves),
    used_days: num(r.used_days ?? r.leaves_taken),
    carryover_days: num(r.carryover_days),
    accrued_days: num(r.accrued_days),
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapLeavePermission(r: any): DbLeavePermission {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    date: r.date || "",
    start_time: hhmmFromFloatOrLabel(r.start_time),
    end_time: hhmmFromFloatOrLabel(r.end_time),
    hours: num(r.hours),
    reason: r.reason || null,
    status: r.status || r.state || "",
    approved_by: r.approved_by || null,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapLeavePolicy(r: any): DbLeavePolicy {
  return {
    id: sid(r.id),
    leave_type_id: sid(r.leave_type_id),
    scope: r.scope || "global",
    scope_value: r.scope_value || null,
    days_per_year: num(r.days_per_year),
    max_days_per_request: r.max_days_per_request ?? null,
    allow_half_day: r.allow_half_day ?? null,
    is_active: r.active !== false && r.is_active !== false,
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}

export function mapAllowanceType(r: any): DbAllowanceType {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name || r.name_en || null,
    calc_method: r.calc_method || "fixed",
    default_amount: num(r.default_amount),
    percentage_of: r.percentage_of || "basic",
    is_taxable: bool(r.is_taxable),
    is_active: r.active !== false && r.is_active !== false,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
  };
}

export function mapEmployeeAllowance(r: any): DbEmployeeAllowance {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    allowance_type_id: sid(r.allowance_type_id),
    amount: num(r.amount),
    currency: r.currency || "IQD",
    is_active: r.active !== false && r.is_active !== false,
    start_date: r.start_date || null,
    end_date: r.end_date || null,
    created_at: r.created_at || empty,
  };
}

export function mapDeductionType(r: any): DbDeductionType {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name || r.name_en || null,
    calc_method: r.calc_method || "fixed",
    default_amount: num(r.default_amount),
    default_percentage: num(r.default_percentage),
    percentage_of: r.percentage_of || "basic",
    is_mandatory: bool(r.is_mandatory),
    is_active: r.active !== false && r.is_active !== false,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
  };
}

export function mapEmployeeDeduction(r: any): DbEmployeeDeduction {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    deduction_type_id: sid(r.deduction_type_id),
    amount: num(r.amount),
    percentage: num(r.percentage),
    calc_method: r.calc_method || "fixed",
    currency: r.currency || "IQD",
    is_active: r.active !== false && r.is_active !== false,
    start_date: r.start_date || null,
    end_date: r.end_date || null,
    created_at: r.created_at || empty,
  };
}

export function mapDocumentType(r: any): DbDocumentType {
  return {
    id: sid(r.id),
    name_ar: r.name_ar || r.name || "",
    name_en: r.name || r.name_en || null,
    code: r.code || "",
    has_expiry: bool(r.has_expiry),
    expiry_warning_days: num(r.before_days ?? r.expiry_warning_days, 30),
    is_required: bool(r.is_required),
    required_for_contract_types: r.required_for_contract_types || null,
    is_active: r.active !== false && r.is_active !== false,
    sort_order: num(r.sort_order),
    created_at: r.created_at || empty,
  };
}

export function mapDocument(r: any): DbEmployeeDocument {
  return {
    id: sid(r.id),
    employee_id: sid(r.employee_id),
    document_type_id: sid(r.document_type_id),
    document_number: r.document_number || r.name || null,
    issue_date: r.issue_date || null,
    expiry_date: r.expiry_date || null,
    file_url: r.file_url || r.attachment_url || null,
    file_name: r.file_name || r.name || null,
    notes: r.description || r.notes || null,
    status: r.status || "valid",
    created_at: r.created_at || empty,
    updated_at: r.updated_at || empty,
  };
}
