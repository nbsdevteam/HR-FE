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
