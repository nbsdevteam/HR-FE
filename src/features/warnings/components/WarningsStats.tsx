import { AlertTriangle, FileWarning, ShieldAlert } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import { arabicSource } from "@/i18n/source";
import type { WarningStats } from "../utils/warningsStats";

type WarningsStatsProps = {
  stats: WarningStats;
  typeColors: Record<string, string>;
};

const WarningsStats = ({ stats, typeColors }: WarningsStatsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <StatCard
      label={arabicSource("common.total")}
      value={stats.total}
      icon={FileWarning}
      index={0}
      layout="center"
      decoration="blob"
      hoverLift
      valueSize={24}
      labelSize={12}
      iconBoxClassName="bg-primary/10 border border-primary/20 text-primary"
      iconClassName="w-5 h-5"
    />

    {stats.byType.map((item, i) => (
      <StatCard
        key={item.type}
        label={item.type}
        value={item.count}
        icon={i < 3 ? AlertTriangle : ShieldAlert}
        index={i + 1}
        layout="center"
        decoration="blob"
        hoverLift
        valueSize={24}
        labelSize={12}
        iconBoxClassName={typeColors[item.type]}
        iconClassName="w-5 h-5"
      />
    ))}
  </div>
);

export default WarningsStats;
