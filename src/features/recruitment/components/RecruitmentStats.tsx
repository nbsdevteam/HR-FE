import { useMemo, memo } from "react";
import StatCard from "@/shared/components/StatCard";
import { recruitmentStatFields } from "../data";

type RecruitmentStatsProps = {
  stats: {
    openJobs: number;
    totalApplicants: number;
    interviewing: number;
    hired: number;
    bookmarked: number;
  };
};

const RecruitmentStats = ({ stats }: RecruitmentStatsProps) => {
  const items = useMemo(
    () => recruitmentStatFields.map(field => ({ ...field, value: stats[field.key as keyof typeof stats] })),
    [stats],
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {items.map((stat, index) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          index={index}
          delayStep={0.05}
          valueSize={26}
          valueMarginClassName="mt-1.5"
          labelSize={12}
          iconBoxPadding="p-2"
          iconClassName="w-4 h-4 text-primary"
        />
      ))}
    </div>
  );
};

export default memo(RecruitmentStats);
