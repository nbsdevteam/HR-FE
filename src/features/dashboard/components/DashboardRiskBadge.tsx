import { dashboardRiskBadgeConfig } from "../data";
import type { DashboardRiskLevel } from "../types";

const DashboardRiskBadge = ({ level }: { level: DashboardRiskLevel }) => {
  const config = dashboardRiskBadgeConfig[level];

  return <span className={`text-xs px-2 py-0.5 rounded-full border ${config.cls}`}>{config.label}</span>;
};

export default DashboardRiskBadge;
