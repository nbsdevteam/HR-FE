import type { ComponentType } from "react";
import { arabicSource } from "@/i18n/source";
import DashboardChartCard from "./DashboardChartCard";
import DashboardQuickIndicatorRow from "./DashboardQuickIndicatorRow";

type DashboardQuickIndicatorsCardProps = {
  indicators: {
    label: string;
    value: number;
    icon: ComponentType<{ className?: string }>;
    color: string;
  }[];
  cardCls: string;
};

const DashboardQuickIndicatorsCard = ({
  indicators,
  cardCls,
}: DashboardQuickIndicatorsCardProps) => (
  <DashboardChartCard delay={0.7} className={cardCls}>
    <h3 className="text-foreground mb-4">
      {arabicSource("dashboard.quick_indicators")}
    </h3>
    <div className="space-y-3">
      {indicators.map((item) => (
        <DashboardQuickIndicatorRow
          key={item.label}
          label={item.label}
          value={item.value}
          icon={item.icon}
          color={item.color}
        />
      ))}
    </div>
  </DashboardChartCard>
);

export default DashboardQuickIndicatorsCard;
