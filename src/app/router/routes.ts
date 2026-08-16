import { createBrowserRouter } from "react-router";
import { Layout } from "@/app/layouts/Layout";
import { Dashboard } from "@/features/dashboard/pages/Dashboard";
import { Employees } from "@/features/employees/pages/Employees";
import { Leave } from "@/features/leave/pages/Leave";
import { Payroll } from "@/features/payroll/pages/Payroll";
import { EvaluationPage } from "@/features/evaluation/pages/Evaluation";
import { Warnings } from "@/features/warnings/pages/Warnings";
import { Policies } from "@/features/policies/pages/Policies";
import { Hierarchy } from "@/features/departments/pages/Hierarchy";
import { Recruitment } from "@/features/recruitment/pages/Recruitment";
import { Training } from "@/features/training/pages/Training";
import { Attendance } from "@/features/attendance/pages/Attendance";
import { Reports } from "@/features/reports/pages/Reports";
import { SettingsPage } from "@/features/settings/pages/Settings";
import { Lifecycle } from "@/features/employees/pages/Lifecycle";
import { AuditCenter } from "@/features/audit/pages/AuditCenter";
import { DeviceManagement } from "@/features/attendance/pages/DeviceManagement";
import { NotFound } from "./NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "employees", Component: Employees },
      { path: "attendance", Component: Attendance },
      { path: "leave", Component: Leave },
      { path: "payroll", Component: Payroll },
      { path: "evaluation", Component: EvaluationPage },
      { path: "warnings", Component: Warnings },
      { path: "policies", Component: Policies },
      { path: "hierarchy", Component: Hierarchy },
      { path: "recruitment", Component: Recruitment },
      { path: "training", Component: Training },
      { path: "reports", Component: Reports },
      { path: "lifecycle", Component: Lifecycle },
      { path: "audit", Component: AuditCenter },
      { path: "devices", Component: DeviceManagement },
      { path: "settings", Component: SettingsPage },
      { path: "*", Component: NotFound },
    ],
  },
]);
