import {
  Briefcase, CalendarDays, Clock, FileCheck, FileText,
  GraduationCap, UserPlus, Users, Wallet, AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { arabicSource } from "@/i18n/source";

export const categoryIcons: Record<string, LucideIcon> = {
  attendance: Clock,
  payroll: Wallet,
  leave: CalendarDays,
  employee: Users,
  contract: Briefcase,
  document: FileCheck,
  recruitment: UserPlus,
  training: GraduationCap,
  warnings: AlertTriangle,
  custom: FileText,
};

export const categoryLabels: Record<string, string> = {
  attendance: arabicSource("common.attendance_2"),
  payroll: arabicSource("reports.financial"),
  leave: arabicSource("common.vacations_2"),
  employee: arabicSource("reports.employees"),
  contract: arabicSource("common.contracts"),
  document: arabicSource("common.documentation"),
  recruitment: arabicSource("reports.recruitment"),
  training: arabicSource("common.training"),
  warnings: arabicSource("common.alarms_2"),
  custom: arabicSource("reports.custom"),
};

/** Report codes with a live `/api/hr/reports/generate` backend generator. */
export const BACKEND_REPORT_CODES = [
  "attendance_monthly",
  "payroll_monthly",
  "leave_requests",
  "punch_audit",
] as const;

/** Legacy/alternate codes the backend resolves to a canonical `BACKEND_REPORT_CODES` entry. */
export const REPORT_CODE_ALIASES: Record<string, string> = {
  leave_monthly: "leave_requests",
  device_events: "punch_audit",
  punch_ledger: "punch_audit",
};

export const resolveReportCode = (code: string): string => REPORT_CODE_ALIASES[code] || code;

export const isBackendReportCode = (code: string): boolean =>
  (BACKEND_REPORT_CODES as readonly string[]).includes(resolveReportCode(code));

/**
 * Field keys hidden from the column picker across every backend report type.
 * `status` duplicates `status_label` (raw code vs. human-readable text) —
 * the backend still returns it for other consumers, it's just not offered
 * as a report column here.
 */
export const HIDDEN_REPORT_FIELD_KEYS: readonly string[] = ["status"];

/**
 * FE-curated default column selections, applied when a user has never picked
 * columns for that report code before (i.e. nothing saved in localStorage
 * yet). Keyed by the resolved (canonical) report code. Falls back to the
 * backend's `default_fields` for any report code not listed here.
 */
export const REPORT_DEFAULT_FIELDS: Record<string, string[]> = {
  attendance_monthly: [
    "employee_name",
    "date",
    "expected_hours",
    "check_in",
    "check_out",
    "worked_hours",
    "shortfall_hours",
    "overtime_hours",
  ],
};
