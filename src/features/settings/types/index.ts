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

export interface NewLeaveTypeForm {
  name_ar: string;
  name_en: string;
  code: string;
  is_paid: boolean;
  default_days_per_year: number;
  allow_half_day: boolean;
  requires_attachment: boolean;
  attachment_after_days: number;
  accrual_method: string;
  is_carryover_allowed: boolean;
  max_carryover_days: number;
  carryover_expiry_months: number;
  is_encashable: boolean;
  encashment_percentage: number;
  color: string;
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
