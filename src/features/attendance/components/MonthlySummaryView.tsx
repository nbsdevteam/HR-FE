import { useMemo } from "react";
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, Clock, Timer, TrendingUp, XCircle } from "lucide-react";
import { formatTime, formatWorkHours, mapAttendanceStatus, type DbAttendanceRecord } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { cardCls, statusColors } from "@/features/attendance/styles";
import { AttendanceSummaryCard } from "./AttendanceSummaryCard";

export function MonthlySummaryView({
  stats,
  monthLabel,
  records,
  calMonth,
  onPrev,
  onNext,
}: {
  stats: { daysWorked: number; totalHours: number; avgHours: number; overtime: number; lateCount: number; lateMins: number; absentCount: number; checkedInOnly: number; totalRecords: number };
  monthLabel: string;
  records: DbAttendanceRecord[];
  calMonth: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Per-day breakdown table
  const sortedRecords = useMemo(() =>
    [...records].sort((a, b) => a.date.localeCompare(b.date)),
  [records]);

  const dayNamesShort: Record<string, string> = {
    sunday: arabicSource("common.sunday"), monday: arabicSource("attendance.two"), tuesday: arabicSource("attendance.tuesday"),
    wednesday: arabicSource("attendance.wed"), thursday: arabicSource("attendance.thursday"), friday: arabicSource("attendance.friday"), saturday: arabicSource("common.sat"),
  };

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
        {[
          { label: arabicSource("common.working_days"), value: stats.daysWorked, color: "text-emerald-400", icon: CalendarDays },
          { label: arabicSource("common.hours_2"), value: formatWorkHours(stats.totalHours), color: "text-blue-400", icon: Clock },
          { label: arabicSource("common.average_day"), value: formatWorkHours(stats.avgHours), color: "text-amber-400", icon: Timer },
          { label: arabicSource("common.additional_label"), value: formatWorkHours(stats.overtime), color: "text-emerald-400", icon: TrendingUp },
          { label: arabicSource("common.delay"), value: `${stats.lateCount} ${arabicSource("common.days_2")}`, color: "text-primary", icon: AlertTriangle },
          { label: arabicSource("common.absence"), value: `${stats.absentCount}`, color: "text-destructive", icon: XCircle },
        ].map((s, i) => (
          <AttendanceSummaryCard key={s.label} label={s.label} value={s.value} icon={s.icon} color={s.color} index={i} compact animated />
        ))}
      </div>

      {/* Daily records table */}
      <div className={`${cardCls} overflow-hidden`}>
        <div className="px-4 py-3 border-b border-border/20">
          <h4 className="text-foreground" style={{ fontSize: 14 }}>{arabicSource("attendance.days_details")}</h4>
        </div>
        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-card/90 backdrop-blur-sm">
              <tr className="border-b border-border/20">
                {[arabicSource("common.date"), arabicSource("common.today"), arabicSource("common.attendance"), arabicSource("common.dismissal"), arabicSource("common.hours_2"), arabicSource("common.additional_label"), arabicSource("common.status")].map(h => (
                  <th key={h} className="px-3 py-2.5 text-muted-foreground text-center whitespace-nowrap" style={{ fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRecords.length > 0 ? sortedRecords.map(r => {
                const statusLabel = mapAttendanceStatus(r.status, r.is_late);
                const sColor = statusColors[statusLabel] || "";
                return (
                  <tr key={r.id} className="border-b border-border/10 hover:bg-muted/5">
                    <td className="px-3 py-2 text-center font-mono text-foreground" style={{ fontSize: 12 }}>{r.date.slice(5)}</td>
                    <td className="px-3 py-2 text-center text-muted-foreground" style={{ fontSize: 11 }}>{dayNamesShort[r.day_of_week?.toLowerCase()] || "—"}</td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-emerald-400 font-mono" style={{ fontSize: 12 }} dir="ltr">{r.check_in_time ? formatTime(r.check_in_time) : "—"}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`font-mono ${r.auto_checkout_applied ? "text-amber-400" : "text-blue-400"}`} style={{ fontSize: 12 }} dir="ltr">
                        {r.check_out_time ? formatTime(r.check_out_time) : "N/A"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center font-mono text-foreground" style={{ fontSize: 12 }}>
                      {r.working_hours > 0 ? formatWorkHours(r.working_hours) : "0h"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.overtime_hours > 0 ? (
                        <span className="text-emerald-400 font-mono" style={{ fontSize: 11 }}>{formatWorkHours(r.overtime_hours)}</span>
                      ) : (
                        <span className="text-muted-foreground/30" style={{ fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-md border ${sColor}`} style={{ fontSize: 10 }}>{statusLabel}</span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground" style={{ fontSize: 13 }}>
                    {arabicSource("attendance.there_are_no_records_for_this_month")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}