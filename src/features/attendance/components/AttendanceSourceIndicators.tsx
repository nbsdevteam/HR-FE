import { Fingerprint, Timer } from "lucide-react";
import type { DbAttendanceRecord } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { TodayAttendanceStats } from "../types";

export const AttendanceSourceIndicators = ({ todayStats, rawRecords, selectedDate }: { todayStats: TodayAttendanceStats; rawRecords: DbAttendanceRecord[]; selectedDate: string }) => {
  return (
    <div className="flex items-center gap-4 px-1 flex-wrap">
      {todayStats.total > 0 && (
        <div className="flex items-center gap-1.5">
          <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-muted-foreground" style={{ fontSize: 11 }}>
            {arabicSource("common.fingerprint_device_2")} {rawRecords.filter(r => r.date === selectedDate && r.source === "device").length} {arabicSource("common.record")}
          </span>
        </div>
      )}
      {todayStats.autoCheckouts > 0 && (
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-400/80" style={{ fontSize: 11 }}>{arabicSource("attendance.auto_exit_2")} {todayStats.autoCheckouts}</span>
        </div>
      )}
    </div>
  );
};
