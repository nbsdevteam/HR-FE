import { arabicSource } from "@/i18n/source";

export const attendanceSeries = [
  { key: "present", label: arabicSource("common.present"), color: "#22C55E" },
  { key: "late", label: arabicSource("common.late"), color: "#D4AF37" },
  { key: "absent", label: arabicSource("common.absent"), color: "#DC2626" },
  { key: "leave", label: arabicSource("common.leave"), color: "#3B82F6" },
];

export const statusColors: Record<string, string> = {
  [arabicSource("common.present")]: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  [arabicSource("common.late")]: "bg-primary/10 border-primary/20 text-primary",
  [arabicSource("common.absent")]: "bg-destructive/10 border-destructive/20 text-destructive",
  [arabicSource("common.leave")]: "bg-blue-500/10 border-blue-500/20 text-blue-400",
};

export const statusDotColors: Record<string, string> = {
  [arabicSource("common.present")]: "bg-emerald-400",
  [arabicSource("common.late")]: "bg-primary",
  [arabicSource("common.absent")]: "bg-destructive",
  [arabicSource("common.leave")]: "bg-blue-400",
};

export const cardCls = "bg-card/30 backdrop-blur-md border border-border/40 rounded-xl overflow-hidden shadow-lg";
