import type { ElementType } from "react";
import { BarChart3, Shield, UserPlus, Users, Wallet } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DashboardKpiSection } from "../types";

export const getDashboardKpiTabs = (): Array<{
  key: DashboardKpiSection;
  label: string;
  icon: ElementType;
}> => [
  { key: "overview", label: arabicSource("common.overview"), icon: BarChart3 },
  { key: "workforce", label: arabicSource("dashboard.manpower"), icon: Users },
  { key: "financial", label: arabicSource("common.finance"), icon: Wallet },
  { key: "compliance", label: arabicSource("dashboard.compliance_and_development"), icon: Shield },
  { key: "recruitment", label: arabicSource("common.recruitment"), icon: UserPlus },
];
