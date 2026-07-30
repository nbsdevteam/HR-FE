import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Employees } from "./pages/Employees";
import { Leave } from "./pages/Leave";
import { Payroll } from "./pages/Payroll";
import { EvaluationPage } from "./pages/Evaluation";
import { Warnings } from "./pages/Warnings";
import { Policies } from "./pages/Policies";
import { Hierarchy } from "./pages/Hierarchy";
import { Recruitment } from "./pages/Recruitment";
import { Training } from "./pages/Training";
import { Attendance } from "./pages/Attendance";
import { Reports } from "./pages/Reports";
import { SettingsPage } from "./pages/Settings";
import { Lifecycle } from "./pages/Lifecycle";
import { AuditCenter } from "./pages/AuditCenter";
import { Diagnostics } from "./pages/Diagnostics";
import { DeviceManagement } from "./pages/DeviceManagement";

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
      { path: "diagnostics", Component: Diagnostics },
      { path: "*", Component: Dashboard },
    ],
  },
]);