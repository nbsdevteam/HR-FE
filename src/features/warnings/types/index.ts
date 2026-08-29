import type { DbWarning } from "@/shared/hooks";

export interface FormData {
  employeeId: string;
  type: string;
  reason: string;
  details: string;
  /**
   * `""` = no expiry, `WARNING_EXPIRY_CUSTOM` = use `expiryDate`, otherwise a
   * month count sent as `duration_months` (backend §3).
   */
  durationMonths: string;
  expiryDate: string;
}

export interface WarningWithEmployee extends DbWarning {
  employeeName?: string;
  employeeDepartment?: string;
}

export type WarningViewMode = "list" | "kanban";

export interface KanbanStatusCol {
  key: string;
  label: string;
  accent: string;
  dotColor: string;
}
