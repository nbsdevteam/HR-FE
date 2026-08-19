import type { ElementType } from "react";
import { BarChart3, Shield, UserPlus, Users, Wallet } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DashboardKpiSection, DashboardRiskLevel } from "./types";

export const dashboardKpiTabs: Array<{
  key: DashboardKpiSection;
  label: string;
  icon: ElementType;
}> = [
  { key: "overview", label: arabicSource("common.overview"), icon: BarChart3 },
  { key: "workforce", label: arabicSource("dashboard.manpower"), icon: Users },
  { key: "financial", label: arabicSource("common.finance"), icon: Wallet },
  {
    key: "compliance",
    label: arabicSource("dashboard.compliance_and_development"),
    icon: Shield,
  },
  {
    key: "recruitment",
    label: arabicSource("common.recruitment"),
    icon: UserPlus,
  },
];

export const dashboardRiskBadgeConfig: Record<
  DashboardRiskLevel,
  { label: string; cls: string }
> = {
  low: {
    label: arabicSource("dashboard.is_low"),
    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  medium: {
    label: arabicSource("common.average"),
    cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  high: {
    label: arabicSource("dashboard.high"),
    cls: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  },
  critical: {
    label: arabicSource("dashboard.critical"),
    cls: "bg-red-500/10 text-red-400 border-red-500/30",
  },
};
