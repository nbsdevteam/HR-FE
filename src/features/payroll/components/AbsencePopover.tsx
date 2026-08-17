import { motion } from "motion/react";
import { X, XCircle } from "lucide-react";
import type { ProcessedAttendanceRecord } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { dayNamesAr } from "../styles";

const AbsencePopover = ({
  records,
  onClose,
  onExcuse,
}: {
  records: ProcessedAttendanceRecord[];
  onClose: () => void;
  onExcuse: (id: string) => void;
}) => {
  const reasonLabels: Record<string, string> = {
    no_punches: arabicSource("payroll.no_fingerprint"),
    late_threshold: arabicSource("payroll.excessive_delay"),
    checkout_without_checkin: arabicSource("payroll.leaving_without_attending"),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="text-foreground">{arabicSource("payroll.absence_details")}</h3>
              <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("payroll.days_of_absence_during_the_month")}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary cursor-pointer">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {records.map((rec) => (
            <div
              key={rec.id}
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
              <button
                onClick={() => onExcuse(rec.id)}
                className={`px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${
                  rec.excusedAbsence
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-muted/10 border-border text-muted-foreground hover:border-primary/30"
                }`}
                style={{ fontSize: 11 }}
              >
                {rec.excusedAbsence ? arabicSource("common.sorry") : arabicSource("common.excuse")}
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-border/30 flex items-center justify-between">
          <span className="text-destructive" style={{ fontSize: 12 }}>
            {arabicSource("payroll.total")} {records.length} {arabicSource("common.days_2")}
          </span>
          <span className="text-emerald-400" style={{ fontSize: 12 }}>
            {arabicSource("common.excused")} {records.filter((r) => r.excusedAbsence).length}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AbsencePopover;
