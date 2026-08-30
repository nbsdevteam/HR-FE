export type PublicLeaveVerificationMethod = "none" | "employee_code" | "birthday" | "phone_last4";

export type PublicLeaveDurationUnit = "day" | "hour";

export type PublicLeaveTypeOption = {
  id: number;
  name: string;
  name_ar: string;
  code: string;
  requires_attachment: boolean;
  allow_hourly: boolean;
  allow_half_day: boolean;
  max_days_per_request: number;
  min_days_per_request: number;
  requires_allocation: boolean;
  color: string;
  icon: string;
};

export type PublicLeaveInfo = {
  company_name: string;
  unusable_reason: "" | "inactive" | "expired" | "quota_reached" | "no_leave_types";
  verification_method: PublicLeaveVerificationMethod;
  min_search_chars: number;
  max_search_results: number;
  allow_attachments: boolean;
  max_hours_per_request: number;
  attachment: {
    enabled: boolean;
    max_mb: number;
    accepted_formats: string[];
  };
  leave_types: PublicLeaveTypeOption[];
};

export type PublicLeaveEmployeeSearchResult = {
  id: number;
  name: string;
  name_ar: string;
  department: string;
  job_title: string;
  verification_method: PublicLeaveVerificationMethod;
  verification_available: boolean;
};

export type PublicLeaveEmployeeSearchResponse = {
  items: PublicLeaveEmployeeSearchResult[];
  truncated: boolean;
  min_search_chars: number;
  too_short: boolean;
};

export type PublicLeaveBalanceItem = {
  leave_type_id: number;
  leave_type_name: string;
  max_leaves: number;
  remaining: number;
  requires_allocation: boolean;
  accrual_enabled: boolean;
  annual_entitlement: number;
  monthly_accrual: number;
  accrued: number;
  accrual_periods: number;
  used: number;
  blocked_by_probation: boolean;
  can_apply: boolean;
};

export type PublicLeaveBalances = {
  employee_id: number;
  employee_name: string;
  joining_date: string;
  probation: boolean;
  probation_end_date: string;
  accrual_excluded: boolean;
  accrual_excluded_reason: string;
  items: PublicLeaveBalanceItem[];
};

export type PublicLeaveAttachmentPayload = {
  file_name: string;
  file_data: string;
};

export type PublicLeaveSubmitPayload = {
  token: string;
  employee_id: number;
  verification?: string;
  leave_type_id: number;
  date_from: string;
  date_to?: string;
  reason: string;
  half_day: boolean;
  duration_unit: PublicLeaveDurationUnit;
  hours?: number | null;
  hour_from?: number | null;
  attachment?: PublicLeaveAttachmentPayload;
  hp: string;
};

export type PublicLeaveSubmitResult = {
  reference_code: string;
  employee_name: string;
  leave_type_name: string;
  date_from: string;
  date_to: string;
  number_of_days: number;
  number_of_hours: number;
  duration_unit: PublicLeaveDurationUnit;
  state: string;
  /** Balance was insufficient on an excuse-eligible type — sent to the direct manager instead of failing (backend v1.16.0 §2.3). */
  excuse_pending?: boolean;
  message?: string;
};

export type PublicLeaveStatusResult = {
  reference_code: string;
  leave_type_name: string;
  date_from: string;
  date_to: string;
  number_of_days: number;
  submitted_at: string;
  state: "submitted" | "pending" | "approved" | "rejected" | "cancelled";
};

export type PublicLeaveStep =
  | "search"
  | "verify"
  | "balances"
  | "form"
  | "review"
  | "success"
  | "track";

export type PublicLeaveRequestFormState = {
  leave_type_id: number | null;
  date_from: string;
  date_to: string;
  reason: string;
  half_day: boolean;
  duration_unit: PublicLeaveDurationUnit;
  hours: string;
  hour_from: string;
  hp: string;
};
