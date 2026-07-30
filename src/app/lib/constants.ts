
import { arabicSource } from "../i18n/source";/**
 * Shared constants for the HR system.
 * Single source of truth for departments, status values, etc.
 */

// ══════════════════════════ Sync Service API ══════════════════════════

/** Base URL for the biometric sync service API */
export const SYNC_API = import.meta.env.VITE_SYNC_API || "http://localhost:8089/api";

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

/** Border color classes per department (for cards & avatars) */
export const DEPT_BORDER_COLORS: Record<string, string> = {
  [arabicSource("common.information_technology")]: "border-cyan-500/40",
  [arabicSource("common.finance")]: "border-emerald-500/40",
  [arabicSource("common.marketing")]: "border-purple-500/40",
  [arabicSource("common.human_resources")]: "border-primary/40",
  [arabicSource("common.operations")]: "border-blue-500/40",
  [arabicSource("common.sales")]: "border-red-400/40",
  [arabicSource("common.management")]: "border-amber-500/40",
};

/** Dot/badge solid color classes per department */
export const DEPT_DOT_COLORS: Record<string, string> = {
  [arabicSource("common.information_technology")]: "bg-cyan-500",
  [arabicSource("common.finance")]: "bg-emerald-500",
  [arabicSource("common.marketing")]: "bg-purple-500",
  [arabicSource("common.human_resources")]: "bg-primary",
  [arabicSource("common.operations")]: "bg-blue-500",
  [arabicSource("common.sales")]: "bg-red-400",
  [arabicSource("common.management")]: "bg-amber-500",
};

/** Hex colors per department (for charts & hierarchy) */
export const DEPT_HEX_COLORS: Record<string, string> = {
  [arabicSource("common.information_technology")]: "#06B6D4",
  [arabicSource("common.finance")]: "#3B82F6",
  [arabicSource("common.marketing")]: "#EC4899",
  [arabicSource("common.human_resources")]: "#F43F5E",
  [arabicSource("common.operations")]: "#EF4444",
  [arabicSource("common.sales")]: "#F59E0B",
  [arabicSource("common.management")]: "#F97316",
};
