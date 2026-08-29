import { arabicSource } from "@/i18n/source";
import { STATUS_TONES } from "@/shared/utils/statusColors";

export const leaveCardClass = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";

export const leaveInputClass = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none";

/**
 * Localized leave status → badge tone. Keyed by the Arabic label rather than a
 * backend code, so it maps onto the shared `STATUS_TONES` vocabulary instead of
 * re-declaring the same Tailwind strings a fourth time.
 */
export const leaveStatusColors: Record<string, string> = {
  [arabicSource("common.pending")]: STATUS_TONES.accent,
  [arabicSource("common.accepted")]: STATUS_TONES.success,
  [arabicSource("common.rejected_3")]: STATUS_TONES.danger,
};

export const leaveKanbanColumns: { key: string; label: string; accent: string; dotColor: string }[] = [
  { key: arabicSource("common.pending"), label: arabicSource("common.pending"), accent: "border-primary/40", dotColor: "bg-primary" },
  { key: arabicSource("common.accepted"), label: arabicSource("common.accepted"), accent: "border-emerald-500/40", dotColor: "bg-emerald-500" },
  { key: arabicSource("common.rejected_3"), label: arabicSource("common.rejected_3"), accent: "border-destructive/40", dotColor: "bg-destructive" },
];
