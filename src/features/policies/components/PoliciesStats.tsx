import { AlertTriangle, Archive, CheckCircle, FileText } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import { arabicSource } from "@/i18n/source";
import { useMemo } from "react";

type PoliciesStatsProps = {
  stats: {
    total: number;
    active: number;
    underReview: number;
    archived: number;
  };
};

const PoliciesStats = ({ stats }: PoliciesStatsProps) => {
  const items = useMemo(
    () => [
      {
        label: arabicSource("policies.total_policies"),
        value: stats.total,
        icon: FileText,
        iconBg: "bg-primary/10 border-primary/20",
        iconColor: "text-primary",
      },
      {
        label: arabicSource("policies.is_active"),
        value: stats.active,
        icon: CheckCircle,
        iconBg: "bg-emerald-500/10 border-emerald-500/20",
        iconColor: "text-emerald-400",
      },
      {
        label: arabicSource("common.is_under_review"),
        value: stats.underReview,
        icon: AlertTriangle,
        iconBg: "bg-primary/10 border-primary/20",
        iconColor: "text-primary",
      },
      {
        label: arabicSource("policies.archived"),
        value: stats.archived,
        icon: Archive,
        iconBg: "bg-muted/10 border-border",
        iconColor: "text-muted-foreground",
      },
    ],
    [stats.total, stats.active, stats.underReview, stats.archived],
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((stat, index) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          index={index}
          decoration="glow"
          hoverLift
          cardClassName="bg-card/30 backdrop-blur-md border border-border/40"
          labelSize={14}
          valueSize={24}
          valueClassName="text-gradient-gold font-bold"
          iconBoxPadding="p-3"
          iconBoxClassName={`border ${stat.iconBg}`}
          iconClassName={`w-5 h-5 ${stat.iconColor}`}
        />
      ))}
    </div>
  );
};

export default PoliciesStats;
