import { formatMonthYear, type MonthFormat } from "@/app/providers";
import { arabicSource } from "@/i18n/source";
import type {
  NewContractTypeForm, NewDocTypeForm, NewHolidayForm, NewLeaveTypeForm,
  NotifKey, NotifToggles,
} from "../types";

// ── Curated department color palette — 15 distinct, accessible hues ──
export const DEPT_COLOR_PALETTE = [
  "#FFD700", // Gold — reserved for senior management.
  "#8B5CF6", // Violet
  "#3B82F6", // Blue
  "#06B6D4", // Cyan
  "#22C55E", // Green
  "#EC4899", // Pink
  "#EF4444", // Red
  "#F59E0B", // Orange
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#A855F7", // Purple
  "#0EA5E9", // Light blue
  "#D946EF", // Fuchsia
  "#84CC16", // Lime
  "#F43F5E", // Crimson
];

export const MONTH_FORMATS: { value: MonthFormat; label: string; example: string }[] = [
  { value: "name", label: arabicSource("settings.name_of_the_month"), example: formatMonthYear("2026-02", "name") },
  { value: "numeric", label: arabicSource("settings.digital"), example: formatMonthYear("2026-02", "numeric") },
];

export const DAYS_OF_WEEK = [
  { key: "sunday", label: arabicSource("common.sunday_2") },
  { key: "monday", label: arabicSource("settings.monday") },
  { key: "tuesday", label: arabicSource("common.tuesday") },
  { key: "wednesday", label: arabicSource("common.wednesday") },
  { key: "thursday", label: arabicSource("common.thursday") },
  { key: "friday", label: arabicSource("common.friday") },
  { key: "saturday", label: arabicSource("common.saturday") },
];

export const categoryLabels: Record<string, string> = {
  payroll: arabicSource("settings.salaries_and_compensation"),
  leave: arabicSource("common.vacations"),
  attendance: arabicSource("common.attendance_and_departure"),
  employee: arabicSource("settings.personnel_affairs"),
  system: arabicSource("common.system"),
};

export const INITIAL_NEW_HOLIDAY: NewHolidayForm = { name_ar: "", name_en: "", date: "", is_recurring: false };

export const INITIAL_NEW_LEAVE_TYPE: NewLeaveTypeForm = {
  name_ar: "", name_en: "", code: "", is_paid: true, default_days_per_year: 0,
  allow_half_day: false, requires_attachment: false, attachment_after_days: 0,
  accrual_method: "annual", is_carryover_allowed: false, max_carryover_days: 0,
  carryover_expiry_months: 3, is_encashable: false, encashment_percentage: 100,
  color: "#3b82f6", sort_order: 0,
};

export const INITIAL_NEW_CONTRACT_TYPE: NewContractTypeForm = {
  name_ar: "", name_en: "", code: "", description: "",
  default_duration_months: 12, is_renewable: true, probation_days: 90,
  notice_period_days: 30, sort_order: 0,
};

export const INITIAL_NEW_DOC_TYPE: NewDocTypeForm = {
  name_ar: "", name_en: "", code: "", has_expiry: true,
  expiry_warning_days: 30, is_required: false, sort_order: 0,
};

export const INITIAL_NOTIF_TOGGLES: NotifToggles = {
  leave: true,
  lateAttendance: true,
  warnings: true,
  evaluations: false,
  recruitment: true,
};

export const NOTIFICATION_ITEMS: { label: string; key: NotifKey }[] = [
  { label: arabicSource("settings.leave_request_notices"), key: "leave" },
  { label: arabicSource("settings.late_attendance_notices"), key: "lateAttendance" },
  { label: arabicSource("settings.notifications_of_new_alarms"), key: "warnings" },
  { label: arabicSource("settings.assessments_notices"), key: "evaluations" },
  { label: arabicSource("settings.recruitment_notices"), key: "recruitment" },
];

export const HOLIDAY_YEAR_OPTIONS = [2025, 2026, 2027];

export const PERSONAL_ACCOUNT_ITEMS: { label: string; value: string }[] = [
  { label: arabicSource("settings.full_name"), value: arabicSource("common.human_resources_manager") },
  { label: arabicSource("common.email"), value: "hr@company.iq" },
  { label: arabicSource("common.phone_number"), value: "07701234567" },
];
