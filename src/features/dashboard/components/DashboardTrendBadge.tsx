import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type DashboardTrendBadgeProps = {
  value: number;
  suffix?: string;
  inverse?: boolean;
};

export const DashboardTrendBadge = ({ value, suffix = "", inverse = false }: DashboardTrendBadgeProps) => {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNeutral = value === 0;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
      isNeutral ? "bg-muted/30 text-muted-foreground"
        : isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
    }`}>
      {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value)}{suffix}
    </span>
  );
};
