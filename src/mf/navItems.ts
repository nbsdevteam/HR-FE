/**
 * HR's entries in the shell's sidebar.
 *
 * labelKey is resolved against the shell's i18next instance; label is the literal fallback for the
 * period before HR's catalogue is registered as a namespace there, so the rail never shows a raw
 * key. Both are provided deliberately — a missing translation should degrade to readable text, not
 * to "hr.nav.payroll".
 *
 * Icons are lucide names as strings: the shell owns the icon set, so this app ships no icon bundle
 * into the host.
 *
 * order continues after the CRM apps' numbering (which ends at 210) so HR lands as its own block at
 * the foot of the rail rather than interleaved with sales and supply screens.
 */
import { ROUTE_SEGMENT } from "@/app/router/routePaths";

type NavContribution = {
  id: string;
  path: string;
  labelKey: string;
  label?: string;
  icon: string;
  permissionKeys?: string[];
  order?: number;
};

const hrPath = (segment: string): string => "/hr/" + segment;

const navItems: NavContribution[] = [
  {
    id: "hr-employees",
    path: hrPath(ROUTE_SEGMENT.employees),
    labelKey: "hr.nav.employees",
    label: "Employees",
    icon: "Users",
    permissionKeys: ["hr.employees"],
    order: 300,
  },
  {
    id: "hr-attendance",
    path: hrPath(ROUTE_SEGMENT.attendance),
    labelKey: "hr.nav.attendance",
    label: "Attendance",
    icon: "Clock",
    permissionKeys: ["hr.attendance"],
    order: 310,
  },
  {
    id: "hr-leave",
    path: hrPath(ROUTE_SEGMENT.leave),
    labelKey: "hr.nav.leave",
    label: "Leave",
    icon: "CalendarDays",
    permissionKeys: ["hr.leave"],
    order: 320,
  },
  {
    id: "hr-payroll",
    path: hrPath(ROUTE_SEGMENT.payroll),
    labelKey: "hr.nav.payroll",
    label: "Payroll",
    icon: "Wallet",
    permissionKeys: ["hr.payroll"],
    order: 330,
  },
  {
    id: "hr-evaluation",
    path: hrPath(ROUTE_SEGMENT.evaluation),
    labelKey: "hr.nav.evaluation",
    label: "Performance",
    icon: "ClipboardCheck",
    permissionKeys: ["hr.evaluations"],
    order: 340,
  },
  {
    id: "hr-warnings",
    path: hrPath(ROUTE_SEGMENT.warnings),
    labelKey: "hr.nav.warnings",
    label: "Warnings",
    icon: "AlertTriangle",
    permissionKeys: ["hr.warnings"],
    order: 350,
  },
  {
    id: "hr-policies",
    path: hrPath(ROUTE_SEGMENT.policies),
    labelKey: "hr.nav.policies",
    label: "Policies",
    icon: "FileText",
    permissionKeys: ["hr.policies"],
    order: 360,
  },
  {
    id: "hr-hierarchy",
    path: hrPath(ROUTE_SEGMENT.hierarchy),
    labelKey: "hr.nav.hierarchy",
    label: "Org structure",
    icon: "GitBranch",
    permissionKeys: ["hr.departments", "hr.org"],
    order: 370,
  },
  {
    id: "hr-recruitment",
    path: hrPath(ROUTE_SEGMENT.recruitment),
    labelKey: "hr.nav.recruitment",
    label: "Recruitment",
    icon: "UserPlus",
    permissionKeys: ["hr.recruitment"],
    order: 380,
  },
  {
    id: "hr-training",
    path: hrPath(ROUTE_SEGMENT.training),
    labelKey: "hr.nav.training",
    label: "Training",
    icon: "GraduationCap",
    permissionKeys: ["hr.training"],
    order: 390,
  },
  {
    id: "hr-lifecycle",
    path: hrPath(ROUTE_SEGMENT.lifecycle),
    labelKey: "hr.nav.lifecycle",
    label: "Employee lifecycle",
    icon: "Briefcase",
    permissionKeys: ["hr.lifecycle"],
    order: 400,
  },
  {
    id: "hr-devices",
    path: hrPath(ROUTE_SEGMENT.devices),
    labelKey: "hr.nav.devices",
    label: "Fingerprint devices",
    icon: "Fingerprint",
    permissionKeys: ["hr.devices"],
    order: 410,
  },
  {
    id: "hr-audit",
    path: hrPath(ROUTE_SEGMENT.audit),
    labelKey: "hr.nav.audit",
    label: "HR records",
    icon: "Shield",
    permissionKeys: ["hr.audit", "hr.documents", "hr.notes"],
    order: 420,
  },
  {
    id: "hr-settings",
    path: hrPath(ROUTE_SEGMENT.settings),
    labelKey: "hr.nav.settings",
    label: "HR settings",
    icon: "Settings",
    permissionKeys: ["hr.configs", "hr.modules"],
    order: 430,
  },
];

export default navItems;
