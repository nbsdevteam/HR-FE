export interface ShiftDaySchedule {
  is_working: boolean;
  start: string;
  end: string;
}

export interface ShiftEditState {
  id: string;
  name: string;
  description: string;
  grace_minutes: number;
  late_to_absent_hours: number;
  target_hours_per_day: number;
  days: Record<string, ShiftDaySchedule>;
}

export interface NewHolidayForm {
  name_ar: string;
  name_en: string;
  date: string;
  is_recurring: boolean;
}

export type LeaveTypeGenderRestriction = "" | "male" | "female";

export interface NewLeaveTypeForm {
  // basic
  name_ar: string;
  name_en: string;
  is_paid: boolean;
  default_days_per_year: number;
  /** Monthly accrual engine (backend v1.12.9) — 1.75 days per completed month, etc. */
  accrual_enabled: boolean;
  /** `0` lets the backend derive the rate from `default_days_per_year / 12`. */
  accrual_days_per_month: number;

  // advanced: Accrual
  accrual_method: string;

  // advanced: Leave Rules
  allow_half_day: boolean;
  allow_hourly: boolean;
  requires_attachment: boolean;
  /** Type cannot be taken while the employee is on probation. */
  probation_blocked: boolean;
  gender_restriction: LeaveTypeGenderRestriction;
  min_service_months: number;
  min_days_per_request: number;
  max_days_per_request: number;
  /** Insufficient-balance requests go to the manager as an approve/reject exception instead of being rejected outright. */
  excuse_on_insufficient_balance: boolean;

  // advanced: Carryover / Encashment
  is_carryover_allowed: boolean;
  max_carryover_days: number;
  is_encashable: boolean;
  encashment_percentage: number;

  // advanced: Other
  code: string;
  color: string;
  icon: string;
  sort_order: number;
}

export interface NewContractTypeForm {
  name_ar: string;
  name_en: string;
  code: string;
  description: string;
  default_duration_months: number;
  is_renewable: boolean;
  probation_days: number;
  notice_period_days: number;
  sort_order: number;
}

export interface NewDocTypeForm {
  name_ar: string;
  name_en: string;
  code: string;
  has_expiry: boolean;
  expiry_warning_days: number;
  is_required: boolean;
  sort_order: number;
}

/** A configuration row's editable value — the shapes the settings UI produces. */
export type ConfigValue = string | number | boolean;

/** One text/number input inside a `NewTypeForm` grid row. */
export interface TypeFormFieldConfig<T> {
  key: Extract<keyof T, string>;
  placeholder: string;
  type?: "text" | "number";
  dir?: "ltr" | "rtl";
  /** Render `0` as an empty input (used for optional numeric fields). */
  blankWhenFalsy?: boolean;
}

/** A grid row of inputs — `gridClassName` carries the row's column layout. */
export interface TypeFormRowConfig<T> {
  id: string;
  gridClassName: string;
  fields: TypeFormFieldConfig<T>[];
}

/** One boolean toggle inside a `NewTypeForm` checkbox row. */
export interface TypeFormCheckboxConfig<T> {
  key: Extract<keyof T, string>;
  label: string;
}

export type NotifKey = "leave" | "lateAttendance" | "warnings" | "evaluations" | "recruitment";

export type NotifToggles = Record<NotifKey, boolean>;

/** Create/edit form for a public leave-request link (backend hand-off §8). */
export interface LeaveLinkFormState {
  name: string;
  active: boolean;
  expires_on: string;
  max_submissions: number;
  require_verification: "none" | "employee_code" | "birthday" | "phone_last4";
  allow_attachments: boolean;
  leave_type_ids: string[];
  department_ids: string[];
}
