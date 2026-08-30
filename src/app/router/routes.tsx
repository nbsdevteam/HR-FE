import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import Layout from "@/app/layouts/Layout";
import NotFound from "./NotFound";
import HydrateFallback from "./HydrateFallback";
import RequireHrRoute from "./RequireHrRoute";
import { ROUTE_SEGMENT } from "./routePaths";

/**
 * Wraps a page's dynamic import in the `{ lazy: () => ... }` shape react-router
 * expects, gated behind `RequireHrRoute` so direct URL navigation respects the
 * same permission the sidebar link is filtered by. `importFn` must contain a
 * literal `import("...")` at its call site (not, e.g., a variable path) so
 * Vite can still statically split it into its own chunk — wrapping it in this
 * helper doesn't change that.
 */
const lazyRoute = (importFn: () => Promise<{ default: ComponentType }>, routeKeys: string[]) => ({
  lazy: async () => {
    const module = await importFn();
    const Page = module.default;
    const Guarded = () => (
      <RequireHrRoute routeKeys={routeKeys}>
        <Page />
      </RequireHrRoute>
    );
    return { Component: Guarded };
  },
});

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    HydrateFallback,
    children: [
      {
        index: true,
        ...lazyRoute(() => import("@/features/dashboard/pages/Dashboard"), ["hr.dashboard"]),
      },
      {
        path: ROUTE_SEGMENT.employees,
        ...lazyRoute(() => import("@/features/employees/pages/Employees"), ["hr.employees"]),
      },
      {
        path: ROUTE_SEGMENT.attendance,
        ...lazyRoute(() => import("@/features/attendance/pages/Attendance"), ["hr.attendance"]),
      },
      {
        path: ROUTE_SEGMENT.leave,
        ...lazyRoute(() => import("@/features/leave/pages/Leave"), ["hr.leave"]),
      },
      {
        path: ROUTE_SEGMENT.payroll,
        ...lazyRoute(() => import("@/features/payroll/pages/Payroll"), ["hr.payroll"]),
      },
      {
        path: ROUTE_SEGMENT.evaluation,
        ...lazyRoute(() => import("@/features/evaluation/pages/Evaluation"), ["hr.evaluations"]),
      },
      {
        path: ROUTE_SEGMENT.warnings,
        ...lazyRoute(() => import("@/features/warnings/pages/Warnings"), ["hr.warnings"]),
      },
      {
        path: ROUTE_SEGMENT.policies,
        ...lazyRoute(() => import("@/features/policies/pages/Policies"), ["hr.policies"]),
      },
      {
        path: ROUTE_SEGMENT.hierarchy,
        ...lazyRoute(() => import("@/features/departments/pages/Hierarchy"), ["hr.departments", "hr.org"]),
      },
      {
        path: ROUTE_SEGMENT.recruitment,
        ...lazyRoute(() => import("@/features/recruitment/pages/Recruitment"), ["hr.recruitment"]),
      },
      {
        path: ROUTE_SEGMENT.training,
        ...lazyRoute(() => import("@/features/training/pages/Training"), ["hr.training"]),
      },
      {
        path: ROUTE_SEGMENT.reports,
        ...lazyRoute(() => import("@/features/reports/pages/Reports"), ["hr.reports"]),
      },
      {
        path: ROUTE_SEGMENT.lifecycle,
        ...lazyRoute(() => import("@/features/employees/pages/Lifecycle"), ["hr.lifecycle"]),
      },
      {
        path: ROUTE_SEGMENT.audit,
        ...lazyRoute(() => import("@/features/audit/pages/AuditCenter"), ["hr.audit", "hr.documents", "hr.notes"]),
      },
      {
        path: ROUTE_SEGMENT.devices,
        ...lazyRoute(() => import("@/features/attendance/pages/DeviceManagement"), ["hr.devices"]),
      },
      {
        path: ROUTE_SEGMENT.settings,
        ...lazyRoute(() => import("@/features/settings/pages/Settings"), ["hr.configs", "hr.modules"]),
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
