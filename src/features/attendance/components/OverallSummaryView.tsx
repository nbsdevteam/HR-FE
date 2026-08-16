import { Calendar, CalendarDays, Clock, Award } from "lucide-react";
import { formatWorkHours } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { cardCls } from "@/features/attendance/styles";
import { AttendanceSummaryCard } from "./AttendanceSummaryCard";

export function OverallSummaryView({
  stats,
  breakdown,
}: {
  stats: {
    daysWorked: number; totalHours: number; avgHours: number; overtime: number;
    lateCount: number; lateMins: number; absentCount: number; totalRecords: number;
    monthsCount: number; firstDate: string; lastDate: string; presentDays: number; attendanceRate: number;
  };
  breakdown: Array<{ month: string; days: number; hours: number; overtime: number; late: number; absent: number }>;
}) {
  const monthNames: Record<string, string> = {
    "01": arabicSource("common.january"), "02": arabicSource("common.february"), "03": arabicSource("common.march"), "04": arabicSource("common.april"),
    "05": arabicSource("common.may"), "06": arabicSource("common.jun"), "07": arabicSource("common.july"), "08": arabicSource("common.august"),
    "09": arabicSource("common.september"), "10": arabicSource("common.october_additional"), "11": arabicSource("common.november"), "12": arabicSource("common.december"),
  };

  return (
    <div className="space-y-5">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: arabicSource("attendance.total_working_days"), value: stats.daysWorked, color: "text-emerald-400", icon: CalendarDays },
          { label: arabicSource("common.total_hours"), value: formatWorkHours(stats.totalHours), color: "text-blue-400", icon: Clock },
          { label: arabicSource("attendance.attendance_rate"), value: `${stats.attendanceRate}%`, color: stats.attendanceRate >= 80 ? "text-emerald-400" : "text-amber-400", icon: Award },
          { label: arabicSource("attendance.number_of_months"), value: stats.monthsCount, color: "text-primary", icon: Calendar },
        ].map(s => (
          <AttendanceSummaryCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: arabicSource("common.average_day"), value: formatWorkHours(stats.avgHours) },
          { label: arabicSource("attendance.total_additional"), value: formatWorkHours(stats.overtime) },
          { label: arabicSource("attendance.days_late"), value: `${stats.lateCount} ${arabicSource("common.days_2")}` },
          { label: arabicSource("attendance.days_of_absence"), value: `${stats.absentCount} ${arabicSource("common.days_2")}` },
        ].map(s => (
          <div key={s.label} className={`${cardCls} p-3`}>
            <div className="text-muted-foreground" style={{ fontSize: 10 }}>{s.label}</div>
            <div className="text-foreground font-mono mt-1" style={{ fontSize: 15 }}>{s.value}</div>
          </div>
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
                {[arabicSource("attendance.month"), arabicSource("attendance.days"), arabicSource("common.hours_2"), arabicSource("attendance.average"), arabicSource("common.additional_label"), arabicSource("common.delay"), arabicSource("common.absence")].map(h => (
                  <th key={h} className="px-3 py-2.5 text-muted-foreground text-center whitespace-nowrap" style={{ fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {breakdown.map(row => {
                const [yr, mn] = row.month.split("-");
                const avg = row.days > 0 ? row.hours / row.days : 0;
                return (
                  <tr key={row.month} className="border-b border-border/10 hover:bg-muted/5">
                    <td className="px-3 py-2 text-center text-foreground" style={{ fontSize: 12 }}>
                      {monthNames[mn] || mn} {yr}
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-emerald-400" style={{ fontSize: 12 }}>{row.days}</td>
                    <td className="px-3 py-2 text-center font-mono text-blue-400" style={{ fontSize: 12 }}>{formatWorkHours(row.hours)}</td>
                    <td className="px-3 py-2 text-center font-mono text-amber-400" style={{ fontSize: 12 }}>{formatWorkHours(avg)}</td>
                    <td className="px-3 py-2 text-center font-mono text-emerald-400" style={{ fontSize: 12 }}>{row.overtime > 0 ? formatWorkHours(row.overtime) : "—"}</td>
                    <td className="px-3 py-2 text-center" style={{ fontSize: 12 }}>
                      {row.late > 0 ? <span className="text-primary">{row.late}</span> : <span className="text-muted-foreground/30">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center" style={{ fontSize: 12 }}>
                      {row.absent > 0 ? <span className="text-destructive">{row.absent}</span> : <span className="text-muted-foreground/30">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
