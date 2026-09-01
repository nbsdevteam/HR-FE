/**
 * Wire types for the Control Panel aggregate endpoints (lugal_hr 1.18.0).
 *
 * Every enum on the wire is the raw English key (`completed`, `open`,
 * `active`, ...). Map to a display label at the render layer via
 * `@/i18n/status`; never compare a payload value against an Arabic label.
 */
export type ControlPanelSection =
  | "workforce"
  | "financial"
  | "compliance"
  | "recruitment";

export type ControlPanelRiskLevel = "low" | "medium" | "high" | "critical";

/** `{ id?, label, value }` — the shape every server-side breakdown arrives in. */
export type LabelledValue = {
  id?: number;
  label: string;
  value: number;
};

export type ControlPanelScope = {
  department_id: number | null;
  employee_count_in_scope: number;
  company_wide: boolean;
};

export type ControlPanelTenure = {
  avg_years: number;
  median_years: number;
  under_1: number;
  y1_to_3: number;
  y3_to_5: number;
  over_5: number;
};

export type ControlPanelHeadcount = {
  total: number;
  active: number;
  inactive: number;
  by_department: LabelledValue[];
  new_hires_30d: number;
  new_hires_90d: number;
  new_hire_rate: number;
  tenure: ControlPanelTenure;
  trend_12m: { month: string; value: number }[];
  turnover_rate_12m: number;
};

export type ControlPanelAttendance = {
  present: number;
  absent: number;
  late: number;
  on_leave: number;
  attendance_rate: number;
  prev_attendance_rate: number;
  punctuality_rate: number;
  prev_absent: number;
  prev_late: number;
  rolling_7d_rate: number;
  rolling_30d_rate: number;
  absenteeism_rate_30d: number;
  device_events_today: number;
  device_coverage: number;
  by_department_7d: LabelledValue[];
  by_day_of_week_90d: { day: string; value: number }[];
};

export type ControlPanelLeave = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  utilization: {
    rate: number;
    total_entitled: number;
    total_used: number;
    avg_used_days: number;
  };
};

export type ControlPanelContracts = {
  active: number;
  probation: number;
  expiring: number;
  expired: number;
};

export type ControlPanelDocuments = {
  expiring: number;
  expired: number;
};

export type ControlPanelWarnings = {
  active: number;
  by_type: Record<string, number>;
  escalation_risk: number;
};

export type ControlPanelLoans = {
  active: number;
  total_balance: number;
  total_granted: number;
  utilization: number;
};

export type ControlPanelExits = {
  completed_12m: number;
  completed_total: number;
  in_progress: number;
};

export type ControlPanelPayroll = {
  total_salaries: number;
  avg_salary: number;
  median_salary: number;
  total_allowances: number;
  allowance_count: number;
  total_deductions: number;
  deduction_count: number;
  total_compensation: number;
  cost_per_employee: number;
  by_department: LabelledValue[];
  /** Thousands of IQD, ascending by month. */
  monthly_trend: { month: string; net_total: number }[];
  mom_change_pct: number;
};

export type ControlPanelRiskItemKey =
  | "expired_docs"
  | "expiring_docs"
  | "expiring_contracts"
  | "active_warnings"
  | "escalation_risk"
  | "absenteeism"
  | "turnover"
  | "pending_leaves";

export type ControlPanelRiskItem = {
  key: ControlPanelRiskItemKey;
  /** The number — or percentage, for `absenteeism` / `turnover` — that tripped the rule. */
  count: number;
  points: number;
  level: ControlPanelRiskLevel;
};

export type ControlPanelRisk = {
  score: number;
  level: ControlPanelRiskLevel;
  /** Sorted by `points` descending. */
  items: ControlPanelRiskItem[];
};

export type ControlPanelNotification = {
  id: number;
  title: string;
  body?: string;
  type?: string;
  category?: string;
  icon_name?: string;
  icon_color?: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
};

export type ControlPanelNewJoiner = {
  id: number;
  name: string;
  joining_date: string;
  department_name: string | null;
  designation_name: string | null;
};

/** Every dashboard threshold, resolved server-side and keyed by config key. */
export type ControlPanelConfig = Record<string, number>;

export type ControlPanelEvaluations = {
  by_status: Record<string, number>;
  total: number;
  completed: number;
  pending: number;
  avg_rating: number;
  high_performers: number;
  low_performers: number;
  coverage_rate: number;
  /** Keys are `"1"`...`"5"`; a rating with no evaluations is absent, not zero. */
  rating_distribution: Record<string, number>;
};

export type ControlPanelTraining = {
  programs_by_status: Record<string, number>;
  total_programs: number;
  ongoing: number;
  completed: number;
  participants_by_status: Record<string, number>;
  total_participants: number;
  completion_rate: number;
  unique_trainees: number;
  coverage_rate: number;
  avg_score: number;
};

export type ControlPanelRecruitment = {
  jobs_by_status: Record<string, number>;
  total_jobs: number;
  open_positions: number;
  closed_positions: number;
  on_hold_positions: number;
  total_applicants: number;
  avg_applicants_per_job: number;
  stages: Record<string, number>;
  hired: number;
  offer_accept_rate: number;
  bookmarked: number;
  avg_time_to_fill_days: number;
};

export type ControlPanelOverview = {
  as_of: string;
  business_date: string;
  scope: ControlPanelScope;
  headcount: ControlPanelHeadcount;
  attendance: ControlPanelAttendance;
  leave: ControlPanelLeave;
  contracts: ControlPanelContracts;
  documents: ControlPanelDocuments;
  warnings: ControlPanelWarnings;
  loans: ControlPanelLoans;
  exits: ControlPanelExits;
  payroll: ControlPanelPayroll;
  risk: ControlPanelRisk;
  notifications: { unread: number; preview: ControlPanelNotification[] };
  new_joiners: ControlPanelNewJoiner[];
  config: ControlPanelConfig;
};

/**
 * One tab's payload. Which keys are present depends on `section`:
 * workforce → headcount/leave/contracts/exits · financial → payroll/loans ·
 * compliance → documents/contracts/warnings/evaluations/training ·
 * recruitment → recruitment/exits.
 */
export type ControlPanelSectionPayload = {
  section: ControlPanelSection;
  as_of: string;
  business_date: string;
  config: ControlPanelConfig;
  headcount?: ControlPanelHeadcount;
  leave?: ControlPanelLeave;
  contracts?: ControlPanelContracts;
  documents?: ControlPanelDocuments;
  warnings?: ControlPanelWarnings;
  payroll?: ControlPanelPayroll;
  loans?: ControlPanelLoans;
  exits?: ControlPanelExits;
  evaluations?: ControlPanelEvaluations;
  training?: ControlPanelTraining;
  recruitment?: ControlPanelRecruitment;
};

export type DeviceStatusDevice = {
  id: number | string;
  name?: string;
  model_name?: string;
  model?: string;
  serial_number?: string;
  ip_address?: string;
  port?: number;
  use_https?: boolean;
  username?: string | null;
  location?: string | null;
  active?: boolean;
  last_sync_at?: string | null;
  last_heartbeat_at?: string | null;
};

export type DeviceStatusPayload = {
  status: "online" | "stale" | "offline" | "no_device";
  total_devices: number;
  active_devices: number;
  last_sync_at: string | null;
  sync_age_minutes: number;
  today_device_events: number;
  devices: DeviceStatusDevice[];
};
