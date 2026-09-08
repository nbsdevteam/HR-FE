import {
  Home, Users, CalendarDays, Wallet, ClipboardCheck, AlertTriangle,
  FileText, GitBranch, UserPlus, GraduationCap, Clock, BarChart3,
  Settings, Shield, Briefcase, Fingerprint,
} from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { ROUTE_SEGMENT } from "@/app/router/routePaths";
import type { SidebarMenuItem } from "./SidebarNavItem";

/**
 * Single source of truth for the app's top-level pages — shared by
 * Sidebar.tsx (the nav rail) and the command palette's "Pages" group, so the
 * two lists can't drift apart.
 */
export const menuItems: SidebarMenuItem[] = [
  { id: "dashboard", label: arabicSource("common.control_panel"), icon: Home, path: "/", routeKeys: ["hr.dashboard"] },
  { id: "employees", label: arabicSource("common.employees"), icon: Users, path: `/${ROUTE_SEGMENT.employees}`, routeKeys: ["hr.employees"] },
  { id: "attendance", label: arabicSource("common.attendance_and_departure"), icon: Clock, path: `/${ROUTE_SEGMENT.attendance}`, routeKeys: ["hr.attendance"] },
  { id: "leave", label: arabicSource("common.vacations"), icon: CalendarDays, path: `/${ROUTE_SEGMENT.leave}`, routeKeys: ["hr.leave"] },
  { id: "payroll", label: arabicSource("common.salaries"), icon: Wallet, path: `/${ROUTE_SEGMENT.payroll}`, routeKeys: ["hr.payroll"] },
  { id: "evaluation", label: arabicSource("common.performance_evaluation"), icon: ClipboardCheck, path: `/${ROUTE_SEGMENT.evaluation}`, routeKeys: ["hr.evaluations"] },
  { id: "warnings", label: arabicSource("common.alarms"), icon: AlertTriangle, path: `/${ROUTE_SEGMENT.warnings}`, routeKeys: ["hr.warnings"] },
  { id: "policies", label: arabicSource("shared.policies"), icon: FileText, path: `/${ROUTE_SEGMENT.policies}`, routeKeys: ["hr.policies"] },
  { id: "hierarchy", label: arabicSource("common.organizational_structure"), icon: GitBranch, path: `/${ROUTE_SEGMENT.hierarchy}`, routeKeys: ["hr.departments", "hr.org"] },
  { id: "recruitment", label: arabicSource("common.recruitment"), icon: UserPlus, path: `/${ROUTE_SEGMENT.recruitment}`, routeKeys: ["hr.recruitment"] },
  { id: "training", label: arabicSource("common.training_and_development"), icon: GraduationCap, path: `/${ROUTE_SEGMENT.training}`, routeKeys: ["hr.training"] },
  { id: "lifecycle", label: arabicSource("common.employee_life_cycle"), icon: Briefcase, path: `/${ROUTE_SEGMENT.lifecycle}`, routeKeys: ["hr.lifecycle"] },
  { id: "reports", label: arabicSource("common.reports"), icon: BarChart3, path: `/${ROUTE_SEGMENT.reports}`, routeKeys: ["hr.reports"] },
  { id: "devices", label: arabicSource("common.fingerprint_devices"), icon: Fingerprint, path: `/${ROUTE_SEGMENT.devices}`, routeKeys: ["hr.devices"] },
  { id: "audit", label: arabicSource("shared.records_and_notices"), icon: Shield, path: `/${ROUTE_SEGMENT.audit}`, routeKeys: ["hr.audit", "hr.documents", "hr.notes"] },
  { id: "settings", label: arabicSource("common.settings"), icon: Settings, path: `/${ROUTE_SEGMENT.settings}`, routeKeys: ["hr.configs", "hr.modules"] },
];
