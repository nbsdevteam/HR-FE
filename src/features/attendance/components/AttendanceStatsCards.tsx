import { Calendar, CheckCircle, Clock, Timer, XCircle } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import { arabicSource } from "@/i18n/source";
import type { TodayAttendanceStats } from "../types";
import { useMemo } from "react";

const AttendanceStatsCards = ({ todayStats }: { todayStats: TodayAttendanceStats }) => {
  const stats = useMemo(() => [
    { label: arabicSource("attendance.are_present"), value: todayStats.present, icon: CheckCircle, color: "text-emerald-400", accent: "from-emerald-500/10" },
    { label: arabicSource("attendance.are_late"), value: todayStats.late, icon: Clock, color: "text-primary", accent: "from-primary/10" },
    { label: arabicSource("attendance.are_absent"), value: todayStats.absent, icon: XCircle, color: "text-destructive", accent: "from-destructive/10" },
    { label: arabicSource("common.leave"), value: todayStats.leave, icon: Calendar, color: "text-blue-400", accent: "from-blue-500/10" },
    { label: arabicSource("attendance.average_hours"), value: todayStats.avgHours, icon: Timer, color: "text-amber-400", accent: "from-amber-500/10", suffix: arabicSource("common.hours") },
  ], [todayStats.present, todayStats.late, todayStats.absent, todayStats.leave, todayStats.avgHours]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          suffix={stat.suffix}
          index={index}
          delayStep={0.08}
          decoration="blob"
          decorationClassName={stat.accent}
          hoverLift
          valueSize={26}
          valueMarginClassName="mt-1.5"
          labelSize={12}
          iconClassName={`w-4.5 h-4.5 ${stat.color}`}
        />
      ))}
    </div>
  );
};

export default AttendanceStatsCards;
