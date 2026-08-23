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
