import { BookmarkCheck, Briefcase, FileCheck, UserPlus, Users } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import { arabicSource } from "@/i18n/source";

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
  const items = [
    { label: arabicSource("recruitment.vacancies_2"), value: stats.openJobs, icon: Briefcase },
    { label: arabicSource("common.total_applicants"), value: stats.totalApplicants, icon: Users },
    { label: arabicSource("recruitment.under_interview"), value: stats.interviewing, icon: UserPlus },
    { label: arabicSource("recruitment.hired"), value: stats.hired, icon: FileCheck },
    { label: arabicSource("recruitment.preferred_candidates"), value: stats.bookmarked, icon: BookmarkCheck },
  ];

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

export default RecruitmentStats;
