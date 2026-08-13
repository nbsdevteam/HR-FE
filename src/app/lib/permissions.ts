/**
 * HR frontend permission helpers — reuse CRM `/api/crm/me/permissions`.
 * Do not invent a second permission system.
 */

export type HrPermissionTree = Record<string, unknown>;

export interface HrPermissionState {
  permissions: HrPermissionTree;
  routes: Record<string, boolean>;
  role: string;
  role_label: string;
  job_title: string;
}

/** Phase-1 gated SPA paths → visibility rules (section routes, not `routes.hr`). */
export const PHASE1_GATES = {
  payroll: { routes: ["hr.payroll"] as const },
  devices: { routes: ["hr.devices"] as const },
  audit: { routes: ["hr.audit", "hr.notifications"] as const },
  /** Settings is admin-ish; list/view alone must not open the page. */
  settings: {
    permissions: ["hr.configs.edit", "hr.modules.edit", "hr.shifts.create"] as const,
  },
} as const;

export function readPermissionLeaf(
  permissions: HrPermissionTree | null | undefined,
  path: string,
): boolean {
  if (!permissions || !path) return false;
  let node: unknown = permissions;
  for (const part of path.split(".")) {
    if (node == null || typeof node !== "object") return false;
    node = (node as Record<string, unknown>)[part];
  }
  return node === true;
}

export function can(
  permissions: HrPermissionTree | null | undefined,
  path: string,
): boolean {
  return readPermissionLeaf(permissions, path);
}

export function canAny(
  permissions: HrPermissionTree | null | undefined,
  paths: readonly string[],
): boolean {
  return paths.some((p) => can(permissions, p));
}

export function canRoute(
  routes: Record<string, boolean> | null | undefined,
  routeKey: string,
): boolean {
  return Boolean(routes?.[routeKey]);
}

export function canAnyRoute(
  routes: Record<string, boolean> | null | undefined,
  routeKeys: readonly string[],
): boolean {
  return routeKeys.some((k) => canRoute(routes, k));
}

export function isPhase1Allowed(
  state: Pick<HrPermissionState, "permissions" | "routes"> | null | undefined,
  module: keyof typeof PHASE1_GATES,
): boolean {
  if (!state) return false;
  const gate = PHASE1_GATES[module];
  if ("routes" in gate) {
    return canAnyRoute(state.routes, gate.routes);
  }
  return canAny(state.permissions, gate.permissions);
}

export function emptyPermissionState(): HrPermissionState {
  return {
    permissions: {},
    routes: {},
    role: "none",
    role_label: "None",
    job_title: "",
  };
}
