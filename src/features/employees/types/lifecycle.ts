import type {
  DbEmployee,
} from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { Briefcase, FileText, LogOut } from "lucide-react";

export const lifecycleTabs = [
  { id: "contracts", label: arabicSource("lifecycle.contracts"), icon: Briefcase },
  { id: "documents", label: arabicSource("lifecycle.documentation"), icon: FileText },
  { id: "exit", label: arabicSource("lifecycle.end_of_service"), icon: LogOut },
] as const;

export type LifecycleTabId = (typeof lifecycleTabs)[number]["id"];

export type EmployeeMap = Record<string, DbEmployee>;

/** One line of an exit process's clearance checklist. */
export type ExitChecklistLine = {
  id: string;
  checklist_item_id: string;
  is_completed: boolean;
  completed_at?: string | null;
};
