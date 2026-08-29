import { memo, useMemo } from "react";
import { Award, ClipboardCheck, Target, TrendingUp } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import { arabicSource } from "@/i18n/source";

type EvaluationStatsProps = {
  totalEvals: number;
  completedCount: number;
  inProgressCount: number;
  avgRating: string;
};

const EvaluationStats = ({
  totalEvals,
  completedCount,
  inProgressCount,
  avgRating,
}: EvaluationStatsProps) => {
  const stats = useMemo(() => {
    return [
      {
        label: arabicSource("evaluation.total_ratings"),
        value: totalEvals,
        icon: ClipboardCheck,
      },
      {
        label: arabicSource("common.complete_2"),
        value: completedCount,
        icon: Award,
      },
      {
        label: arabicSource("common.under_evaluation"),
        value: inProgressCount,
        icon: Target,
      },
      {
        label: arabicSource("evaluation.average_rating"),
        value: avgRating,
        icon: TrendingUp,
      },
    ];
  }, [totalEvals, completedCount, inProgressCount, avgRating]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          index={i}
          delayStep={0.05}
          decoration="glow"
          hoverLift
          valueMarginClassName="mt-2"
        />
      ))}
    </div>
  );
};

export default memo(EvaluationStats);
