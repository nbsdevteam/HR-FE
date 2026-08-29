import { CalendarDays, Timer, TrendingDown } from "lucide-react";
import { arabicSource } from "@/i18n/source";

export const leaveTabs = [
  { id: "requests", label: arabicSource("leave.leave_requests"), icon: CalendarDays },
  { id: "balances", label: arabicSource("leave.leave_balances"), icon: TrendingDown },
  { id: "permissions", label: arabicSource("leave.permissions"), icon: Timer },
] as const;

export type LeaveTabId = (typeof leaveTabs)[number]["id"];

export type LeaveViewMode = "list" | "kanban";

export type LeaveSortKey = "employee" | "type" | "start" | "end" | "days" | "status";
