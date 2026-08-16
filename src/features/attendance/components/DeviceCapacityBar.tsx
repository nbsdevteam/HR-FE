import type { ElementType } from "react";

type DeviceCapacityBarProps = {
  label: string;
  icon: ElementType;
  used: number;
  total: number;
  color: string;
};

export const DeviceCapacityBar = ({ label, icon: Icon, used, total, color }: DeviceCapacityBarProps) => {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;

  return (
    <div className="bg-card/30 backdrop-blur-md p-4 rounded-xl border border-border/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <span className="text-sm font-mono text-foreground">{used} / {total}</span>
      </div>
      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
};
