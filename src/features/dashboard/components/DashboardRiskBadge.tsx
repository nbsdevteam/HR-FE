import { arabicSource } from "@/i18n/source";
import type { DashboardRiskLevel } from "../types";

export const DashboardRiskBadge = ({ level }: { level: DashboardRiskLevel }) => {
  const config = {
    low: { label: arabicSource("dashboard.is_low"), cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    medium: { label: arabicSource("common.average"), cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
    high: { label: arabicSource("dashboard.high"), cls: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
    critical: { label: arabicSource("dashboard.critical"), cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  }[level];

  return <span className={`text-xs px-2 py-0.5 rounded-full border ${config.cls}`}>{config.label}</span>;
};
