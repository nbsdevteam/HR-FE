import { BarChart3, ClipboardCheck, FileText, Users } from "lucide-react";
import { arabicSource } from "@/i18n/source";

export const reportTemplatesTableColumns = [
  { label: arabicSource("reports.report"), key: "name" },
  { label: arabicSource("common.category"), key: "category" },
  { label: arabicSource("reports.columns"), key: null },
  { label: arabicSource("reports.formula"), key: null },
  { label: arabicSource("reports.procedure"), key: null },
] as const;

export const reportsStatFields = [
  { key: "templateCount", label: arabicSource("reports.report_templates"), icon: BarChart3 },
  { key: "historyCount", label: arabicSource("reports.reports_generated"), icon: FileText },
  { key: "departmentCount", label: arabicSource("common.sections"), icon: Users },
  { key: "employeeCount", label: arabicSource("common.total_employees"), icon: ClipboardCheck },
] as const;
