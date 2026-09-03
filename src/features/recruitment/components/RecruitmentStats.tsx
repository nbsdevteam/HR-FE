import { useMemo, memo } from "react";
import StatCard from "@/shared/components/StatCard";
import { recruitmentStatFields } from "../data";

interface IRecruitmentStatsProps {
  stats: {
    openJobs: number;
    totalApplicants: number;
    interviewing: number;
    hired: number;
    bookmarked: number;
  };
}

const RecruitmentStats = ({ stats }: IRecruitmentStatsProps) => {
  const items = useMemo(
    () =>
      recruitmentStatFields.map((field) => ({
        ...field,
        value: stats[field.key as keyof typeof stats],
      })),
    [stats],
  );

  return (
    <div className="grid grid-cols-2 min-[800px]:grid-cols-3 min-[1020px]:grid-cols-5 gap-4 [&>*:last-child]:col-span-2 min-[800px]:[&>*:last-child]:col-span-1">
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
