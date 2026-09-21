import type { ComponentType } from "react";
import type { RouteObject } from "react-router";
import RequireHrRoute from "@/app/router/RequireHrRoute";
import { ROUTE_SEGMENT } from "@/app/router/routePaths";

/**
 * HR's routes as the CRM shell mounts them.
 *
 * Two differences from src/app/router/routes.tsx, which stays exactly as it was for standalone:
 *
 * 1. NO Layout. The shell supplies the chrome — sidebar, header, branch selector, marquee — so
 *    these are bare page routes patched into the shell's authenticated subtree.
 * 2. Every path is namespaced under hr/. crm-core already claims /reports and /settings, and HR has
 *    screens by both names; two apps claiming one prefix makes which one wins an ordering accident.
 *    The namespace also reads better in the shell: /hr/payroll says whose payroll.
 *
 * RequireHrRoute is kept. The shell gates on ITS permission tree, which knows nothing about
 * hr.payroll — HR's own keys come from /api/hr/permissions, and this is what enforces them.
 */
const page = (
  importFn: () => Promise<{ default: ComponentType }>,
  routeKeys: string[]
) => ({
  lazy: async () => {
    const { default: Page } = await importFn();
    const Guarded = () => (
      <RequireHrRoute routeKeys={routeKeys}>
        <Page />
      </RequireHrRoute>
    );
    return { Component: Guarded };
  },
});

const routes: RouteObject[] = [
  {
    path: "hr/" + ROUTE_SEGMENT.employees,
    ...page(() => import("@/features/employees/pages/Employees"), ["hr.employees"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.attendance,
    ...page(() => import("@/features/attendance/pages/Attendance"), ["hr.attendance"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.leave,
    ...page(() => import("@/features/leave/pages/Leave"), ["hr.leave"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.payroll,
    ...page(() => import("@/features/payroll/pages/Payroll"), ["hr.payroll"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.evaluation,
    ...page(() => import("@/features/evaluation/pages/Evaluation"), ["hr.evaluations"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.warnings,
    ...page(() => import("@/features/warnings/pages/Warnings"), ["hr.warnings"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.policies,
    ...page(() => import("@/features/policies/pages/Policies"), ["hr.policies"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.hierarchy,
    ...page(() => import("@/features/departments/pages/Hierarchy"), ["hr.departments", "hr.org"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.recruitment,
    ...page(() => import("@/features/recruitment/pages/Recruitment"), ["hr.recruitment"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.training,
    ...page(() => import("@/features/training/pages/Training"), ["hr.training"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.lifecycle,
    ...page(() => import("@/features/employees/pages/Lifecycle"), ["hr.lifecycle"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.reports,
    ...page(() => import("@/features/reports/pages/Reports"), ["hr.reports"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.audit,
    ...page(() => import("@/features/audit/pages/AuditCenter"), [
      "hr.audit",
      "hr.documents",
      "hr.notes",
    ]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.devices,
    ...page(() => import("@/features/attendance/pages/DeviceManagement"), ["hr.devices"]),
  },
  {
    path: "hr/" + ROUTE_SEGMENT.settings,
    ...page(() => import("@/features/settings/pages/Settings"), ["hr.configs", "hr.modules"]),
  },
];

export default routes;
