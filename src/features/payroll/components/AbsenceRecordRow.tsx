import { memo, useCallback } from "react";
import type { ProcessedAttendanceRecord } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { dayNamesAr } from "../styles";
import PopoverExcuseButton from "./shared/PopoverExcuseButton";

type AbsenceRecordRowProps = {
  rec: ProcessedAttendanceRecord;
  reasonLabels: Record<string, string>;
  onExcuse: (id: string) => void;
};

const AbsenceRecordRow = ({ rec, reasonLabels, onExcuse }: AbsenceRecordRowProps) => {
  const handleExcuse = useCallback(() => onExcuse(rec.id), [onExcuse, rec.id]);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        rec.excusedAbsence
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-destructive/5 border-destructive/15"
      }`}
    >
      <div className="flex items-center gap-3">
        <div>
          <p className="text-foreground" style={{ fontSize: 13 }}>{rec.date}</p>
          <p className="text-muted-foreground" style={{ fontSize: 11 }}>
            {dayNamesAr[rec.dayOfWeek] || rec.dayOfWeek} — {reasonLabels[rec.absenceReason || ""] || arabicSource("common.absence_2")}
          </p>
        </div>
      </div>
      <PopoverExcuseButton excused={Boolean(rec.excusedAbsence)} onClick={handleExcuse} paddingClassName="px-3 py-1.5" />
    </div>
  );
};

export default memo(AbsenceRecordRow);
