import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { ForbiddenPage } from "./components/RequireHr";
import {
  GuardedPayroll,
  GuardedDevices,
  GuardedAudit,
  GuardedSettings,
} from "./components/Phase1Guards";
import { Dashboard } from "./pages/Dashboard";
import { Employees } from "./pages/Employees";
import { Leave } from "./pages/Leave";
import { EvaluationPage } from "./pages/Evaluation";
import { Warnings } from "./pages/Warnings";
import { Policies } from "./pages/Policies";
import { Hierarchy } from "./pages/Hierarchy";
import { Recruitment } from "./pages/Recruitment";
import { Training } from "./pages/Training";
import { Attendance } from "./pages/Attendance";
import { Reports } from "./pages/Reports";
import { Lifecycle } from "./pages/Lifecycle";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "employees", Component: Employees },
      { path: "attendance", Component: Attendance },
      { path: "leave", Component: Leave },
      { path: "payroll", Component: GuardedPayroll },
      { path: "evaluation", Component: EvaluationPage },
      { path: "warnings", Component: Warnings },
      { path: "policies", Component: Policies },
      { path: "hierarchy", Component: Hierarchy },
      { path: "recruitment", Component: Recruitment },
      { path: "training", Component: Training },
      { path: "reports", Component: Reports },
      { path: "lifecycle", Component: Lifecycle },
      { path: "audit", Component: GuardedAudit },
      { path: "devices", Component: GuardedDevices },
      { path: "settings", Component: GuardedSettings },
      { path: "forbidden", Component: ForbiddenPage },
      { path: "*", Component: NotFound },
    ],
  },
]);
