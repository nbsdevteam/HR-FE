import { Bell, Shield } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DashboardRiskLevel } from "../types";
import { DashboardRiskBadge } from "./DashboardRiskBadge";

type DashboardHeaderProps = {
  riskLevel: DashboardRiskLevel;
  unreadCount: number;
};

export const DashboardHeader = ({ riskLevel, unreadCount }: DashboardHeaderProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-gradient-gold text-xl sm:text-2xl">{arabicSource("common.control_panel")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{arabicSource("dashboard.kpis_live_data_from_the_database")}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
      <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border ${
        riskLevel === "critical" ? "bg-red-500/10 border-red-500/30"
          : riskLevel === "high" ? "bg-orange-500/10 border-orange-500/30"
            : riskLevel === "medium" ? "bg-amber-500/10 border-amber-500/30"
              : "bg-emerald-500/10 border-emerald-500/30"
      }`}>
        <Shield className={`w-4 h-4 flex-shrink-0 ${
          riskLevel === "critical" ? "text-red-400"
            : riskLevel === "high" ? "text-orange-400"
              : riskLevel === "medium" ? "text-amber-400" : "text-emerald-400"
        }`} />
        <span className="text-sm whitespace-nowrap">
          {arabicSource("dashboard.risks")} <DashboardRiskBadge level={riskLevel} />
        </span>
      </div>
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <Bell className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-amber-400 text-sm whitespace-nowrap">{unreadCount} {arabicSource("dashboard.new_notice")}</span>
        </div>
      )}
    </div>
  </div>
);
