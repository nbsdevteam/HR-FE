import { DEPT_BORDER_COLORS, DEPT_DOT_COLORS } from "@/shared/constants";
import { arabicSource } from "@/i18n/source";

export const deptColors = DEPT_BORDER_COLORS;

export const deptDots = DEPT_DOT_COLORS;

export const accentColors = [
  "#F0C419",
  "#22C55E",
  "#3B82F6",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
  "#F97316",
  "#E74C3C",
];

export const statusColors: Record<string, string> = {
  [arabicSource("common.is_active")]: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  [arabicSource("common.leave")]: "bg-primary/10 border-primary/20 text-primary",
  [arabicSource("common.finished")]: "bg-destructive/10 border-destructive/20 text-destructive",
  [arabicSource("common.pending")]: "bg-amber-500/10 border-amber-500/20 text-amber-400",
};
