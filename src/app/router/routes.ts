import type { ComponentType } from "react";
import { createBrowserRouter } from "react-router";
import Layout from "@/app/layouts/Layout";
import NotFound from "./NotFound";
import HydrateFallback from "./HydrateFallback";
import { ROUTE_SEGMENT } from "./routePaths";

/**
 * Wraps a page's dynamic import in the `{ lazy: () => ... }` shape react-router
 * expects. `importFn` must contain a literal `import("...")` at its call site
 * (not, e.g., a variable path) so Vite can still statically split it into its
 * own chunk — wrapping it in this helper doesn't change that.
 */
const lazyRoute = (importFn: () => Promise<{ default: ComponentType }>) => ({
  lazy: () => importFn().then((module) => ({ Component: module.default })),
});

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    HydrateFallback,
    children: [
      {
        index: true,
        ...lazyRoute(() => import("@/features/dashboard/pages/Dashboard")),
      },
      {
        path: ROUTE_SEGMENT.employees,
        ...lazyRoute(() => import("@/features/employees/pages/Employees")),
      },
      {
        path: ROUTE_SEGMENT.attendance,
        ...lazyRoute(() => import("@/features/attendance/pages/Attendance")),
      },
      {
        path: ROUTE_SEGMENT.leave,
        ...lazyRoute(() => import("@/features/leave/pages/Leave")),
      },
      {
        path: ROUTE_SEGMENT.payroll,
        ...lazyRoute(() => import("@/features/payroll/pages/Payroll")),
      },
      {
        path: ROUTE_SEGMENT.evaluation,
        ...lazyRoute(() => import("@/features/evaluation/pages/Evaluation")),
      },
      {
        path: ROUTE_SEGMENT.warnings,
        ...lazyRoute(() => import("@/features/warnings/pages/Warnings")),
      },
      {
        path: ROUTE_SEGMENT.policies,
        ...lazyRoute(() => import("@/features/policies/pages/Policies")),
      },
      {
        path: ROUTE_SEGMENT.hierarchy,
        ...lazyRoute(() => import("@/features/departments/pages/Hierarchy")),
      },
      {
        path: ROUTE_SEGMENT.recruitment,
        ...lazyRoute(() => import("@/features/recruitment/pages/Recruitment")),
      },
      {
        path: ROUTE_SEGMENT.training,
        ...lazyRoute(() => import("@/features/training/pages/Training")),
      },
      {
        path: ROUTE_SEGMENT.reports,
        ...lazyRoute(() => import("@/features/reports/pages/Reports")),
      },
      {
        path: ROUTE_SEGMENT.lifecycle,
        ...lazyRoute(() => import("@/features/employees/pages/Lifecycle")),
      },
      {
        path: ROUTE_SEGMENT.audit,
        ...lazyRoute(() => import("@/features/audit/pages/AuditCenter")),
      },
      {
        path: ROUTE_SEGMENT.devices,
        ...lazyRoute(() => import("@/features/attendance/pages/DeviceManagement")),
      },
      {
        path: ROUTE_SEGMENT.settings,
        ...lazyRoute(() => import("@/features/settings/pages/Settings")),
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
