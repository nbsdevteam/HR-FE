import { describe, expect, it } from "vitest";
import {
  can,
  canAny,
  canRoute,
  canAnyRoute,
  isPhase1Allowed,
  PHASE1_GATES,
} from "./permissions";

/** Mirrors backend `_HR_OWN` / `_HR_TEAM` / `_HR_FULL` HR packs (subset). */
const HR_OWN = {
  payroll: { view: false, edit: false, generate: false, import: false },
  configs: { list: true, view: true, edit: false },
  modules: { list: true, view: true, edit: false },
  shifts: { list: true, view: true, create: false, edit: false, delete: false },
  devices: { list: false, view: false },
  audit: { list: false, view: false },
  notifications: { list: true, view: true, create: false, edit: true },
};

const HR_TEAM = {
  payroll: { view: true, edit: false, generate: false, import: false },
  configs: { list: true, view: true, edit: false },
  modules: { list: true, view: true, edit: false },
  shifts: { list: true, view: true, create: false, edit: false, delete: false },
  devices: { list: true, view: true },
  audit: { list: true, view: true },
  notifications: { list: true, view: true, create: true, edit: true },
};

const HR_FULL = {
  payroll: { view: true, edit: true, generate: true, import: true },
  configs: { list: true, view: true, edit: true },
  modules: { list: true, view: true, edit: true },
  shifts: { list: true, view: true, create: true, edit: true, delete: true },
  devices: { list: true, view: true, create: true, edit: true, manage: true },
  audit: { list: true, view: true },
  notifications: { list: true, view: true, create: true, edit: true },
};

function routesFromHr(hr: Record<string, Record<string, boolean>>) {
  const routes: Record<string, boolean> = { hr: false };
  for (const [section, leaves] of Object.entries(hr)) {
    const ok = Object.values(leaves).some(Boolean);
    routes[`hr.${section}`] = ok;
    if (ok) routes.hr = true;
  }
  return routes;
}

describe("permission helpers", () => {
  it("reads nested permission leaves", () => {
    expect(can({ hr: HR_FULL }, "hr.payroll.generate")).toBe(true);
    expect(can({ hr: HR_OWN }, "hr.payroll.view")).toBe(false);
    expect(canAny({ hr: HR_TEAM }, ["hr.payroll.generate", "hr.payroll.view"])).toBe(true);
  });

  it("uses section route flags, not only routes.hr", () => {
    const routes = { hr: true, "hr.leave": true, "hr.payroll": false };
    expect(canRoute(routes, "hr")).toBe(true);
    expect(canRoute(routes, "hr.payroll")).toBe(false);
    expect(canAnyRoute(routes, ["hr.payroll", "hr.devices"])).toBe(false);
  });
});

describe("phase-1 gates", () => {
  it("employee (_HR_OWN): hide payroll/settings/devices; audit via notifications", () => {
    const state = { permissions: { hr: HR_OWN }, routes: routesFromHr(HR_OWN) };
    expect(isPhase1Allowed(state, "payroll")).toBe(false);
    expect(isPhase1Allowed(state, "devices")).toBe(false);
    expect(isPhase1Allowed(state, "settings")).toBe(false);
    expect(isPhase1Allowed(state, "audit")).toBe(true); // notifications
  });

  it("supervisor (_HR_TEAM): payroll view + devices + audit; no settings edit", () => {
    const state = { permissions: { hr: HR_TEAM }, routes: routesFromHr(HR_TEAM) };
    expect(isPhase1Allowed(state, "payroll")).toBe(true);
    expect(isPhase1Allowed(state, "devices")).toBe(true);
    expect(isPhase1Allowed(state, "audit")).toBe(true);
    expect(isPhase1Allowed(state, "settings")).toBe(false);
    expect(can(state.permissions, "hr.payroll.generate")).toBe(false);
  });

  it("HR admin (_HR_FULL): all phase-1 modules + payroll actions", () => {
    const state = { permissions: { hr: HR_FULL }, routes: routesFromHr(HR_FULL) };
    for (const mod of Object.keys(PHASE1_GATES) as Array<keyof typeof PHASE1_GATES>) {
      expect(isPhase1Allowed(state, mod)).toBe(true);
    }
    expect(can(state.permissions, "hr.payroll.generate")).toBe(true);
    expect(can(state.permissions, "hr.payroll.import")).toBe(true);
    expect(can(state.permissions, "hr.payroll.edit")).toBe(true);
  });

  it("no HR permissions: everything gated off", () => {
    const state = { permissions: {}, routes: {} };
    expect(isPhase1Allowed(state, "payroll")).toBe(false);
    expect(isPhase1Allowed(state, "devices")).toBe(false);
    expect(isPhase1Allowed(state, "audit")).toBe(false);
    expect(isPhase1Allowed(state, "settings")).toBe(false);
  });
});
