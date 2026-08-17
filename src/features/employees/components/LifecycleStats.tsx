import { AlertTriangle, Briefcase, LogOut, Timer } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import { arabicSource } from "@/i18n/source";

type LifecycleStatsProps = {
  activeContracts: number;
  expiringDocs: number;
  probationAlertsCount: number;
  activeExits: number;
};

const LifecycleStats = ({
  activeContracts,
  expiringDocs,
  probationAlertsCount,
  activeExits,
}: LifecycleStatsProps) => {
  const stats = [
    { label: arabicSource("common.active_contracts"), value: activeContracts, icon: Briefcase, color: "text-emerald-400" },
    { label: arabicSource("lifecycle.documents_are_almost_complete"), value: expiringDocs, icon: AlertTriangle, color: "text-amber-400" },
    { label: arabicSource("lifecycle.close_experience_periods"), value: probationAlertsCount, icon: Timer, color: "text-blue-400" },
    { label: arabicSource("lifecycle.termination_proceedings_in_progress"), value: activeExits, icon: LogOut, color: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          index={i}
          decoration="glow"
          hoverLift
          padding="p-5"
          valueClassName={stat.color}
        />
      ))}
    </div>
  );
};

export default LifecycleStats;
