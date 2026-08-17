import { Calendar, CheckCircle, Clock, Timer, XCircle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { TodayAttendanceStats } from "../types";
import AttendanceStatCard from "./AttendanceStatCard";

const AttendanceStatsCards = ({ todayStats }: { todayStats: TodayAttendanceStats }) => {
  const stats = [
    { label: arabicSource("attendance.are_present"), value: todayStats.present, icon: CheckCircle, color: "text-emerald-400", accent: "from-emerald-500/10" },
    { label: arabicSource("attendance.are_late"), value: todayStats.late, icon: Clock, color: "text-primary", accent: "from-primary/10" },
    { label: arabicSource("attendance.are_absent"), value: todayStats.absent, icon: XCircle, color: "text-destructive", accent: "from-destructive/10" },
    { label: arabicSource("common.leave"), value: todayStats.leave, icon: Calendar, color: "text-blue-400", accent: "from-blue-500/10" },
    { label: arabicSource("attendance.average_hours"), value: todayStats.avgHours, icon: Timer, color: "text-amber-400", accent: "from-amber-500/10", suffix: arabicSource("common.hours") },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <AttendanceStatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          color={stat.color}
          accent={stat.accent}
          suffix={stat.suffix}
          index={index}
        />
      ))}
    </div>
  );
};

export default AttendanceStatsCards;
