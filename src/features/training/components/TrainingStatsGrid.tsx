import { Award, BookOpen, CheckCircle, Play, Users } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import { arabicSource } from "@/i18n/source";
import type { TrainingStats } from "../utils/trainingStats";

type TrainingStatsGridProps = {
  stats: TrainingStats;
};

const TrainingStatsGrid = ({ stats }: TrainingStatsGridProps) => {
  const items = [
    { label: arabicSource("common.total_programs"), value: stats.totalPrograms, icon: BookOpen },
    { label: arabicSource("training.ongoing_programs"), value: stats.ongoingPrograms, icon: Play },
    { label: arabicSource("training.completed_programs"), value: stats.completedPrograms, icon: Award },
    { label: arabicSource("training.total_participants"), value: stats.totalParticipants, icon: Users },
    { label: arabicSource("common.completion_rate"), value: `${stats.completionRate}%`, icon: CheckCircle },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {items.map((stat, i) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} index={i} decoration="blob" hoverLift valueMarginClassName="mt-2" />
      ))}
    </div>
  );
};

export default TrainingStatsGrid;
