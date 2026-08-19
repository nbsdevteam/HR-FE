import type { ComponentType } from "react";

type DashboardQuickIndicatorRowProps = {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  color: string;
};

const DashboardQuickIndicatorRow = ({ label, value, icon: Icon, color }: DashboardQuickIndicatorRowProps) => (
  <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20">
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-sm text-foreground">{label}</span>
    </div>
    <span className={`text-sm font-medium ${color}`}>{value}</span>
  </div>
);

export default DashboardQuickIndicatorRow;
