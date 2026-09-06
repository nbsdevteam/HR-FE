import type { ComponentType, ReactNode } from "react";
import StatCard from "@/shared/components/StatCard";
import DashboardTrendBadge from "./DashboardTrendBadge";

export type DashboardStatCardItem = {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  icon: ComponentType<{ className?: string }>;
  color?: string;
  trend?: number;
  href?: string;
};

type DashboardStatGridProps = {
  stats: DashboardStatCardItem[];
  compactValue?: boolean;
  hoverLift?: boolean;
};

const DashboardStatGrid = ({
  stats,
  compactValue,
  hoverLift,
}: DashboardStatGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
    {stats.map((stat, index) => (
      <StatCard
        key={stat.label}
        label={stat.label}
        value={stat.value}
        icon={stat.icon}
        index={index}
        delayStep={0.07}
        decoration="blob"
        decorationSizeClassName="w-32 h-32"
        hoverLift={hoverLift}
        padding="p-5"
        valueSize={compactValue ? 20 : 24}
        valueClassName={`font-semibold ${stat.color ?? "text-primary"}`}
        dir="ltr"
        href={stat.href}
        sub={stat.sub}
        trailing={
          stat.trend !== undefined ? (
            <DashboardTrendBadge value={stat.trend} suffix="%" />
          ) : undefined
        }
      />
    ))}
  </div>
);

export default DashboardStatGrid;
