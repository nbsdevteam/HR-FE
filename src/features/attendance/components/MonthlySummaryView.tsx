import { useMemo } from "react";
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Clock, Timer, TrendingUp, XCircle } from "lucide-react";
import DataTable from "@/shared/components/DataTable";
import { formatWorkHours, type DbAttendanceRecord } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { cardCls } from "@/features/attendance/styles";
import { dailyRecordsTableHeadings } from "@/features/attendance/data";
import type { MonthAttendanceStats } from "../utils/attendanceStats";
import AttendanceSummaryCard from "./AttendanceSummaryCard";
import AttendanceTableHeaderCell from "./AttendanceTableHeaderCell";
import DailyAttendanceTableRow from "./DailyAttendanceTableRow";

type MonthlySummaryViewProps = {
  stats: MonthAttendanceStats;
  monthLabel: string;
  records: DbAttendanceRecord[];
  onPrev: () => void;
  onNext: () => void;
};

const MonthlySummaryView = ({ stats, monthLabel, records, onPrev, onNext }: MonthlySummaryViewProps) => {
  // Per-day breakdown table
  const sortedRecords = useMemo(() =>
    [...records].sort((a, b) => a.date.localeCompare(b.date)),
  [records]);

  const attendanceSummaryData = useMemo(() => [
    { label: arabicSource("common.working_days"), value: stats.daysWorked, color: "text-emerald-400", icon: CalendarDays },
    { label: arabicSource("common.hours_2"), value: formatWorkHours(stats.totalHours), color: "text-blue-400", icon: Clock },
    { label: arabicSource("common.average_day"), value: formatWorkHours(stats.avgHours), color: "text-amber-400", icon: Timer },
    { label: arabicSource("common.additional_label"), value: formatWorkHours(stats.overtime), color: "text-emerald-400", icon: TrendingUp },
    { label: arabicSource("common.delay"), value: `${stats.lateCount} ${arabicSource("common.days_2")}`, color: "text-primary", icon: AlertTriangle },
    { label: arabicSource("common.absence"), value: `${stats.absentCount}`, color: "text-destructive", icon: XCircle },
  ], [stats.daysWorked, stats.totalHours, stats.avgHours, stats.overtime, stats.lateCount, stats.absentCount]);

  return (
    <div className="space-y-5">
      {/* Month navigator */}
      <div className="flex items-center justify-center gap-4 mb-2">
        <button onClick={onPrev} className="p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <h3 className="text-foreground text-lg">{monthLabel}</h3>
        <button onClick={onNext} className="p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {attendanceSummaryData.map((s, i) => (
          <AttendanceSummaryCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} index={i} compact animated />
        ))}
      </div>

      {/* Daily records table */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-border/20">
          <h4 className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("attendance.days_details")}</h4>
        </div>
        <DataTable
          wrapperClassName={null}
          scrollClassName="overflow-x-auto max-h-[350px] overflow-y-auto"
          theadClassName="sticky top-0 bg-card/90 backdrop-blur-sm"
          items={sortedRecords}
          header={
            <tr className="border-b border-border/20">
              {dailyRecordsTableHeadings.map(h => (
                <AttendanceTableHeaderCell key={h} heading={h} />
              ))}
            </tr>
          }
          renderRow={(r) => <DailyAttendanceTableRow key={r.id} record={r} />}
          emptyRow={
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground" style={{ fontSize: 13 }}>
                {arabicSource("attendance.there_are_no_records_for_this_month")}
              </td>
            </tr>
          }
        />
      </div>
    </div>
  );
};

export default MonthlySummaryView;
