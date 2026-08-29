import type { ComponentType } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  ClipboardCheck,
  Download,
  Edit2,
  Info,
  LogIn,
  Settings,
  Shield,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { arabicSource } from "@/i18n/source";

type IconComponent = ComponentType<{ className?: string }>;

export const actionLabels: Record<string, string> = {
  create: arabicSource("common.create"),
  update: arabicSource("common.update"),
  delete: arabicSource("common.delete"),
  approve: arabicSource("common.agree"),
  reject: arabicSource("common.rejected_2"),
  login: arabicSource("auditcenter.login"),
  export: arabicSource("common.export"),
  import: arabicSource("auditcenter.import"),
  status_change: arabicSource("auditcenter.change_status"),
  configuration_change: arabicSource("auditcenter.change_setting"),
};

export const actionIcons: Record<string, IconComponent> = {
  create: CheckCircle,
  update: Edit2,
  delete: Trash2,
  approve: Check,
  reject: XCircle,
  login: LogIn,
  export: Download,
  import: Upload,
  status_change: ClipboardCheck,
  configuration_change: Settings,
};

export const entityLabels: Record<string, string> = {
  employee: arabicSource("common.employee_2"),
  attendance: arabicSource("common.attendance_2"),
  leave: arabicSource("common.leave"),
  payroll: arabicSource("common.salaries_2"),
  contract: arabicSource("auditcenter.contract"),
  document: arabicSource("auditcenter.document"),
  loan: arabicSource("auditcenter.loan"),
  warning: arabicSource("auditcenter.alarm"),
  report: arabicSource("auditcenter.report"),
  configuration: arabicSource("auditcenter.preparation"),
  module: arabicSource("auditcenter.unit"),
  shift: arabicSource("auditcenter.pink"),
  department: arabicSource("auditcenter.section"),
  approval: arabicSource("common.agree"),
  exit_process: arabicSource("auditcenter.end_of_service"),
  notification: arabicSource("auditcenter.notice"),
};

export const notifTypeIcons: Record<string, IconComponent> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: XCircle,
  action: Bell,
};

export const tabs = [
  {
    key: "notifications" as const,
    label: arabicSource("common.notices"),
    icon: Bell,
  },
  {
    key: "audit" as const,
    label: arabicSource("auditcenter.audit_log"),
    icon: Shield,
  },
];

export const allTypesOptions = [
  { value: "all", label: arabicSource("common.all_types") },
  { value: "info", label: arabicSource("auditcenter.information") },
  { value: "warning", label: arabicSource("auditcenter.warning") },
  { value: "success", label: arabicSource("auditcenter.success") },
  { value: "error", label: arabicSource("common.error") },
  {
    value: "action",
    label: arabicSource("auditcenter.action_required"),
  },
];

export const allCategoriesOptions = [
  { value: "all", label: arabicSource("common.all_categories") },
  { value: "system", label: arabicSource("common.system") },
  { value: "leave", label: arabicSource("common.vacations_2") },
  {
    value: "attendance",
    label: arabicSource("common.attendance_2"),
  },
  { value: "payroll", label: arabicSource("common.salaries_2") },
  { value: "contract", label: arabicSource("common.contracts") },
  {
    value: "document",
    label: arabicSource("common.documentation"),
  },
  {
    value: "approval",
    label: arabicSource("auditcenter.approvals"),
  },
];
