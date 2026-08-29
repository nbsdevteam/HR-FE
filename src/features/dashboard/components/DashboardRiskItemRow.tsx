import DashboardRiskBadge from "./DashboardRiskBadge";
import type { DashboardRiskLevel } from "../types";

type DashboardRiskItemRowProps = {
  label: string;
  level: DashboardRiskLevel;
};

const DashboardRiskItemRow = ({ label, level }: DashboardRiskItemRowProps) => (
  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/10">
    <span className="text-xs text-foreground">{label}</span>
    <DashboardRiskBadge level={level} />
  </div>
);

export default DashboardRiskItemRow;
