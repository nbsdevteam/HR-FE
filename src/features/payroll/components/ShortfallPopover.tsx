import { X, ArrowDownRight } from "lucide-react";
import { formatHoursMinutes, type ProcessedAttendanceRecord } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { ModalOverlay } from "@/shared/components";
import { dayNamesAr } from "../styles";

const ShortfallPopover = ({
  records,
  targetHours,
  onClose,
  onExcuse,
}: {
  records: ProcessedAttendanceRecord[];
  targetHours: number;
  onClose: () => void;
  onExcuse: (id: string) => void;
}) => {
  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      contentMotionProps={{
        initial: { scale: 0.95 },
        animate: { scale: 1 },
        exit: { scale: 0.95 },
      }}
    >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <ArrowDownRight className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-foreground">{arabicSource("payroll.details_of_the_watch_shortage")}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("payroll.days_when_working_hours_are_less_than")} {targetHours} {arabicSource("payroll.hours")}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/10 border-b border-border/20">
                {[arabicSource("common.date"), arabicSource("common.today"), arabicSource("common.attendance"), arabicSource("common.dismissal"), arabicSource("common.working_hours"), arabicSource("common.shortage"), arabicSource("common.status")].map((h) => (
                  <th key={h} className="text-start px-4 py-2.5 text-muted-foreground whitespace-nowrap" style={{ fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((rec) => {
                const shortage = targetHours - rec.workingHours;
                return (
                  <tr key={rec.id} className={`border-b border-border/10 ${rec.excusedShortfall ? "bg-emerald-500/5" : ""}`}>
                    <td className="px-4 py-2.5 text-foreground whitespace-nowrap" style={{ fontSize: 12 }}>{rec.date}</td>
                    <td className="px-4 py-2.5 text-muted-foreground" style={{ fontSize: 12 }}>{dayNamesAr[rec.dayOfWeek] || rec.dayOfWeek}</td>
                    <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 12 }} dir="ltr">{rec.formattedCheckIn || "—"}</td>
                    <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 12 }} dir="ltr">{rec.formattedCheckOut || "—"}</td>
                    <td className="px-4 py-2.5 text-foreground" style={{ fontSize: 12 }}>{rec.workingHours.toFixed(2)}h</td>
                    <td className="px-4 py-2.5 text-amber-400" style={{ fontSize: 12 }}>{shortage.toFixed(2)}h</td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => onExcuse(rec.id)}
                        className={`px-2.5 py-1 rounded-md border cursor-pointer transition-colors ${
                          rec.excusedShortfall
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-muted/10 border-border text-muted-foreground hover:border-primary/30"
                        }`}
                        style={{ fontSize: 11 }}
                      >
                        {rec.excusedShortfall ? arabicSource("common.sorry") : arabicSource("common.excuse")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
            {arabicSource("payroll.total_deficiency")} <span className="text-amber-400">{formatHoursMinutes(records.reduce((s, r) => s + Math.max(0, targetHours - r.workingHours), 0))}</span>
          </span>
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
            {arabicSource("common.excused")} {records.filter((r) => r.excusedShortfall).length} / {records.length}
          </span>
        </div>
    </ModalOverlay>
  );
};

export default ShortfallPopover;
