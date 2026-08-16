import { arabicSource } from "@/i18n/source";

export const leaveCardClass = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";

export const leaveInputClass = "w-full h-10 px-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none";

export const leaveStatusColors: Record<string, string> = {
  [arabicSource("common.pending")]: "bg-primary/10 border-primary/20 text-primary",
  [arabicSource("common.accepted")]: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  [arabicSource("common.rejected_3")]: "bg-destructive/10 border-destructive/20 text-destructive",
};

export const leaveKanbanColumns: { key: string; label: string; accent: string; dotColor: string }[] = [
  { key: arabicSource("common.pending"), label: arabicSource("common.pending"), accent: "border-primary/40", dotColor: "bg-primary" },
  { key: arabicSource("common.accepted"), label: arabicSource("common.accepted"), accent: "border-emerald-500/40", dotColor: "bg-emerald-500" },
  { key: arabicSource("common.rejected_3"), label: arabicSource("common.rejected_3"), accent: "border-destructive/40", dotColor: "bg-destructive" },
];
