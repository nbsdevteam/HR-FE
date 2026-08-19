import { useMemo } from "react";
import { Calendar, CalendarDays, Clock, Award } from "lucide-react";
import { formatWorkHours } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { cardCls } from "@/features/attendance/styles";
import { monthlyBreakdownTableHeadings } from "@/features/attendance/data";
import type { MonthlyBreakdownEntry } from "../types";
import AttendanceSummaryCard from "./AttendanceSummaryCard";
import AttendanceSecondaryStatCard from "./AttendanceSecondaryStatCard";
import AttendanceTableHeaderCell from "./AttendanceTableHeaderCell";
import MonthlyBreakdownTableRow from "./MonthlyBreakdownTableRow";

type OverallSummaryViewProps = {
  stats: {
    daysWorked: number; totalHours: number; avgHours: number; overtime: number;
    lateCount: number; lateMins: number; absentCount: number; totalRecords: number;
    monthsCount: number; firstDate: string; lastDate: string; presentDays: number; attendanceRate: number;
  };
  breakdown: MonthlyBreakdownEntry[];
};

const OverallSummaryView = ({ stats, breakdown }: OverallSummaryViewProps) => {
  const topStats = useMemo(() => [
    { label: arabicSource("attendance.total_working_days"), value: stats.daysWorked, color: "text-emerald-400", icon: CalendarDays },
    { label: arabicSource("common.total_hours"), value: formatWorkHours(stats.totalHours), color: "text-blue-400", icon: Clock },
    { label: arabicSource("attendance.attendance_rate"), value: `${stats.attendanceRate}%`, color: stats.attendanceRate >= 80 ? "text-emerald-400" : "text-amber-400", icon: Award },
    { label: arabicSource("attendance.number_of_months"), value: stats.monthsCount, color: "text-primary", icon: Calendar },
  ], [stats.daysWorked, stats.totalHours, stats.attendanceRate, stats.monthsCount]);

  const secondaryStats = useMemo(() => [
    { label: arabicSource("common.average_day"), value: formatWorkHours(stats.avgHours) },
    { label: arabicSource("attendance.total_additional"), value: formatWorkHours(stats.overtime) },
    { label: arabicSource("attendance.days_late"), value: `${stats.lateCount} ${arabicSource("common.days_2")}` },
    { label: arabicSource("attendance.days_of_absence"), value: `${stats.absentCount} ${arabicSource("common.days_2")}` },
  ], [stats.avgHours, stats.overtime, stats.lateCount, stats.absentCount]);

  return (
    <div className="space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {topStats.map(s => (
          <AttendanceSummaryCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {secondaryStats.map(s => (
          <AttendanceSecondaryStatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>

      {/* Date range */}
      <div className={`${cardCls} px-4 py-3 flex items-center justify-between`}>
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("attendance.data_period")}</span>
        <span className="text-foreground font-mono" style={{ fontSize: 13 }}>{stats.firstDate} → {stats.lastDate}</span>
      </div>

      {/* Monthly breakdown table */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-border/20">
          <h4 className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("attendance.months_details")}</h4>
        </div>
        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card/90 backdrop-blur-sm">
              <tr className="border-b border-border/20">
                {monthlyBreakdownTableHeadings.map(heading => (
                  <AttendanceTableHeaderCell key={heading} heading={heading} />
                ))}
              </tr>
            </thead>
            <tbody>
              {breakdown.map(row => (
                <MonthlyBreakdownTableRow key={row.month} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverallSummaryView;
