/**
 * Single source of truth for the app's route segments — shared by routes.ts
 * (which needs them bare, relative to the root layout route) and Sidebar.tsx
 * (which needs them as absolute `/segment` paths). Kept in its own
 * import-free file: Sidebar can't import routes.ts directly, since routes.ts
 * imports Layout, which renders Sidebar.
 */
export const ROUTE_SEGMENT = {
  employees: "employees",
  attendance: "attendance",
  leave: "leave",
  payroll: "payroll",
  evaluation: "evaluation",
  warnings: "warnings",
  policies: "policies",
  hierarchy: "hierarchy",
  recruitment: "recruitment",
  training: "training",
  lifecycle: "lifecycle",
  reports: "reports",
  audit: "audit",
  devices: "devices",
  settings: "settings",
} as const;
