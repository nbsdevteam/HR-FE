import type { DbWarning } from "@/shared/hooks";

export interface FormData {
  employeeId: string;
  type: string;
  reason: string;
  details: string;
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
