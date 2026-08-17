import type { DashboardStatCardItem } from "./DashboardStatCard";
import DashboardStatCard from "./DashboardStatCard";

type DashboardStatGridProps = {
  stats: DashboardStatCardItem[];
  compactValue?: boolean;
  hoverLift?: boolean;
};

const DashboardStatGrid = ({ stats, compactValue, hoverLift }: DashboardStatGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    {stats.map((stat, index) => (
      <DashboardStatCard
        key={stat.label}
        stat={stat}
        index={index}
        compactValue={compactValue}
        hoverLift={hoverLift}
      />
    ))}
  </div>
);

export default DashboardStatGrid;
