import { motion } from "motion/react";
import { BookmarkCheck, Briefcase, FileCheck, UserPlus, Users } from "lucide-react";
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

export const RecruitmentStats = ({ stats }: RecruitmentStatsProps) => {
  const items = [
    { label: arabicSource("recruitment.vacancies_2"), value: stats.openJobs, icon: Briefcase },
    { label: arabicSource("common.total_applicants"), value: stats.totalApplicants, icon: Users },
    { label: arabicSource("recruitment.under_interview"), value: stats.interviewing, icon: UserPlus },
    { label: arabicSource("recruitment.hired"), value: stats.hired, icon: FileCheck },
    { label: arabicSource("recruitment.preferred_candidates"), value: stats.bookmarked, icon: BookmarkCheck },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {items.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>{stat.label}</p>
                <span className="text-gradient-gold block mt-1.5" style={{ fontSize: 26 }}>{stat.value}</span>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
