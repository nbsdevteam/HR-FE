import type { ElementType, ReactNode } from "react";
import { motion } from "motion/react";
import DashboardTrendBadge from "./DashboardTrendBadge";

export type DashboardStatCardItem = {
  label: string;
  value: ReactNode;
  sub: ReactNode;
  icon: ElementType;
  color?: string;
  trend?: number;
};

type DashboardStatCardProps = {
  stat: DashboardStatCardItem;
  index: number;
  compactValue?: boolean;
  hoverLift?: boolean;
};

const DashboardStatCard = ({
  stat,
  index,
  compactValue = false,
  hoverLift = false,
}: DashboardStatCardProps) => {
  const Icon = stat.icon;

  return (
    <motion.div
      key={stat.label}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={hoverLift ? { y: -4, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)" } : undefined}
      className={`relative bg-card backdrop-blur-sm border border-border rounded-xl p-5 shadow-lg overflow-hidden ${
        hoverLift ? "hover:border-primary/30 transition-colors" : ""
      }`}
    >
      <div className="absolute top-0 end-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
          {stat.trend === undefined ? (
            <p className={`${compactValue ? "text-xl" : "text-2xl"} font-semibold mt-1 ${stat.color ?? "text-primary"}`} dir="ltr">
              {stat.value}
            </p>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <p className={`${compactValue ? "text-xl" : "text-2xl"} font-semibold ${stat.color ?? "text-primary"}`} dir="ltr">
                {stat.value}
              </p>
              <DashboardTrendBadge value={stat.trend} suffix="%" />
            </div>
          )}
          <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>{stat.sub}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardStatCard;
