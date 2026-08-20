import { createBrowserRouter } from "react-router";
import Layout from "@/app/layouts/Layout";
import NotFound from "./NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { 
        index: true, 
        lazy: () => import("@/features/dashboard/pages/Dashboard").then(module => ({ Component: module.default })) 
      },
      { 
        path: "employees", 
        lazy: () => import("@/features/employees/pages/Employees").then(module => ({ Component: module.default })) 
      },
      { 
        path: "attendance", 
        lazy: () => import("@/features/attendance/pages/Attendance").then(module => ({ Component: module.default })) 
      },
      { 
        path: "leave", 
        lazy: () => import("@/features/leave/pages/Leave").then(module => ({ Component: module.default })) 
      },
      { 
        path: "payroll", 
        lazy: () => import("@/features/payroll/pages/Payroll").then(module => ({ Component: module.default })) 
      },
      { 
        path: "evaluation", 
        lazy: () => import("@/features/evaluation/pages/Evaluation").then(module => ({ Component: module.default })) 
      },
      { 
        path: "warnings", 
        lazy: () => import("@/features/warnings/pages/Warnings").then(module => ({ Component: module.default })) 
      },
      { 
        path: "policies", 
        lazy: () => import("@/features/policies/pages/Policies").then(module => ({ Component: module.default })) 
      },
      { 
        path: "hierarchy", 
        lazy: () => import("@/features/departments/pages/Hierarchy").then(module => ({ Component: module.default })) 
      },
      { 
        path: "recruitment", 
        lazy: () => import("@/features/recruitment/pages/Recruitment").then(module => ({ Component: module.default })) 
      },
      { 
        path: "training", 
        lazy: () => import("@/features/training/pages/Training").then(module => ({ Component: module.default })) 
      },
      { 
        path: "reports", 
        lazy: () => import("@/features/reports/pages/Reports").then(module => ({ Component: module.default })) 
      },
      { 
        path: "lifecycle", 
        lazy: () => import("@/features/employees/pages/Lifecycle").then(module => ({ Component: module.default })) 
      },
      { 
        path: "audit", 
        lazy: () => import("@/features/audit/pages/AuditCenter").then(module => ({ Component: module.default })) 
      },
      { 
        path: "devices", 
        lazy: () => import("@/features/attendance/pages/DeviceManagement").then(module => ({ Component: module.default })) 
      },
      { 
        path: "settings", 
        lazy: () => import("@/features/settings/pages/Settings").then(module => ({ Component: module.default })) 
      },
      { 
        path: "*", 
        Component: NotFound 
      },
    ],
  },
]);
