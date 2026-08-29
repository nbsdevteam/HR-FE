
import { arabicSource } from "@/i18n/source";/**
 * Shared constants for the HR system.
 * Single source of truth for departments, status values, etc.
 */

// ══════════════════════════ Sync Service API ══════════════════════════

/**
 * Base URL for the biometric sync / device-management API.
 * Production (hr.nooralnibras.com): same-origin `/device-api` (proxied to Iraq :8089).
 * Local LAN: override with VITE_SYNC_API=http://localhost:8089/api
 */
export const SYNC_API =
  import.meta.env.VITE_SYNC_API ||
  (import.meta.env.DEV ? "http://localhost:8089/api" : "/device-api");

// ══════════════════════════ Departments ══════════════════════════

export const DEPARTMENTS = [
  arabicSource("common.information_technology"),
  arabicSource("common.finance"),
  arabicSource("common.marketing"),
  arabicSource("common.human_resources"),
  arabicSource("common.operations"),
  arabicSource("common.sales"),
  arabicSource("common.management"),
] as const;

export type Department = (typeof DEPARTMENTS)[number];

/** Border/dot/hex colors per department, one entry per department. */
export const DEPARTMENT_COLORS: Record<string, { border: string; dot: string; hex: string }> = {
  [arabicSource("common.information_technology")]: { border: "border-cyan-500/40", dot: "bg-cyan-500", hex: "#06B6D4" },
  [arabicSource("common.finance")]: { border: "border-emerald-500/40", dot: "bg-emerald-500", hex: "#3B82F6" },
  [arabicSource("common.marketing")]: { border: "border-purple-500/40", dot: "bg-purple-500", hex: "#EC4899" },
  [arabicSource("common.human_resources")]: { border: "border-primary/40", dot: "bg-primary", hex: "#F43F5E" },
  [arabicSource("common.operations")]: { border: "border-blue-500/40", dot: "bg-blue-500", hex: "#EF4444" },
  [arabicSource("common.sales")]: { border: "border-red-400/40", dot: "bg-red-400", hex: "#F59E0B" },
  [arabicSource("common.management")]: { border: "border-amber-500/40", dot: "bg-amber-500", hex: "#F97316" },
};

const deptColorEntries = Object.entries(DEPARTMENT_COLORS);

/** @deprecated use `DEPARTMENT_COLORS[dept].border` — kept for existing call sites. */
export const DEPT_BORDER_COLORS: Record<string, string> = Object.fromEntries(
  deptColorEntries.map(([dept, c]) => [dept, c.border]),
);

/** @deprecated use `DEPARTMENT_COLORS[dept].dot` — kept for existing call sites. */
export const DEPT_DOT_COLORS: Record<string, string> = Object.fromEntries(
  deptColorEntries.map(([dept, c]) => [dept, c.dot]),
);

/** @deprecated use `DEPARTMENT_COLORS[dept].hex` — kept for existing call sites. */
export const DEPT_HEX_COLORS: Record<string, string> = Object.fromEntries(
  deptColorEntries.map(([dept, c]) => [dept, c.hex]),
);
