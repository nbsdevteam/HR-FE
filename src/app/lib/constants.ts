/**
 * Shared constants for the HR system.
 * Single source of truth for departments, status values, etc.
 */

// ══════════════════════════ Sync Service API ══════════════════════════

/** Base URL for the biometric sync service API */
export const SYNC_API = import.meta.env.VITE_SYNC_API || "http://localhost:8089/api";

// ══════════════════════════ Departments ══════════════════════════

export const DEPARTMENTS = [
  "تقنية المعلومات",
  "المالية",
  "التسويق",
  "الموارد البشرية",
  "العمليات",
  "المبيعات",
  "الإدارة",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

/** Border color classes per department (for cards & avatars) */
export const DEPT_BORDER_COLORS: Record<Department, string> = {
  "تقنية المعلومات": "border-cyan-500/40",
  "المالية": "border-emerald-500/40",
  "التسويق": "border-purple-500/40",
  "الموارد البشرية": "border-primary/40",
  "العمليات": "border-blue-500/40",
  "المبيعات": "border-red-400/40",
  "الإدارة": "border-amber-500/40",
};

/** Dot/badge solid color classes per department */
export const DEPT_DOT_COLORS: Record<Department, string> = {
  "تقنية المعلومات": "bg-cyan-500",
  "المالية": "bg-emerald-500",
  "التسويق": "bg-purple-500",
  "الموارد البشرية": "bg-primary",
  "العمليات": "bg-blue-500",
  "المبيعات": "bg-red-400",
  "الإدارة": "bg-amber-500",
};

/** Hex colors per department (for charts & hierarchy) */
export const DEPT_HEX_COLORS: Record<Department, string> = {
  "تقنية المعلومات": "#06B6D4",
  "المالية": "#3B82F6",
  "التسويق": "#EC4899",
  "الموارد البشرية": "#F43F5E",
  "العمليات": "#EF4444",
  "المبيعات": "#F59E0B",
  "الإدارة": "#F97316",
};
