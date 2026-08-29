import { DEPT_BORDER_COLORS, DEPT_DOT_COLORS } from "@/shared/constants";
import { STATUS_TONES } from "@/shared/utils/statusColors";
import { arabicSource } from "@/i18n/source";
import { HTMLMotionProps } from "motion/react";

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

/** Arabic employee-status labels mapped onto the shared badge tones. */
export const statusColors: Record<string, string> = {
  [arabicSource("common.is_active")]: STATUS_TONES.success,
  [arabicSource("common.leave")]: STATUS_TONES.accent,
  [arabicSource("common.finished")]: STATUS_TONES.danger,
  [arabicSource("common.pending")]: STATUS_TONES.warning,
};

export const inputCls =
  "w-full h-11 px-4 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none";

export const selectCls = inputCls;

export const labelCls = "text-foreground block mb-1.5";

export const PANEL_OVERLAY_CLASS =
  "fixed inset-0 z-50 flex bg-black/60 backdrop-blur-[4px]";

export const PANEL_CONTENT_CLASS =
  "ms-auto w-full max-w-[680px] h-full bg-card border-s border-border shadow-2xl flex flex-col overflow-hidden";

export const PANEL_CONTENT_MOTION: HTMLMotionProps<"div"> = {
  initial: { x: 80, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 80, opacity: 0 },
  transition: { type: "spring", damping: 28, stiffness: 300 },
};
