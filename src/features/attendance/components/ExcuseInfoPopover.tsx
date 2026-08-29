import { useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { ShieldCheck, X } from "lucide-react";
import { Button, ModalOverlay } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { formatTime, type DbAttendanceRecord } from "@/shared/hooks";
import ExcuseReasonRow from "./ExcuseReasonRow";

type ExcuseInfoPopoverProps = {
  record: DbAttendanceRecord | null;
  onClose: () => void;
};

const ExcuseInfoPopover = ({ record, onClose }: ExcuseInfoPopoverProps) => {
  const reasonLabels = useMemo(() => {
    if (!record) return [];
    const reasons: string[] = [];
    if (record.excused_late) reasons.push(arabicSource("attendance.excuse_for_delay"));
    if (record.excused_shortfall) reasons.push(arabicSource("attendance.excuse_of_lack_of_hours"));
    if (record.excused_absence) reasons.push(arabicSource("attendance.absence_excuse"));
    return reasons;
  }, [record]);

  // excused_at is a bare "YYYY-MM-DD HH:MM:SS" with no offset — already
  // Baghdad-local, so split it directly rather than routing through `new
  // Date()`, which would risk reinterpreting it in the browser's locale.
  const [excusedDate, excusedTimeRaw] = (record?.excused_at || "").split(" ");
  const excusedTime = excusedTimeRaw ? formatTime(excusedTimeRaw) : "";

  return (
    <AnimatePresence>
      {record && (
        <ModalOverlay
          onClose={onClose}
          overlayClassName="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          contentClassName="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
          contentMotionProps={{
            initial: { scale: 0.95, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.95, opacity: 0 },
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border/30">
            <div>
              <h3 className="text-foreground" style={{ fontSize: 16 }}>
                {arabicSource("attendance.employee_s_excuse")}
              </h3>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>{record.date}</p>
            </div>
            <Button
              onClick={onClose}
              variant="unstyled"
              size="unstyled"
              rounded="rounded-lg"
              className="p-1.5 hover:bg-secondary"
              icon={X}
              iconClassName="w-4 h-4 text-muted-foreground"
            />
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              {reasonLabels.map((label) => (
                <ExcuseReasonRow key={label} label={label} />
              ))}
            </div>

            {record.excuse_note && (
              <div>
                <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
                  {arabicSource("attendance.reason_for_excuse")}
                </label>
                <p
                  className="w-full px-4 py-3 rounded-xl border border-border bg-input-background text-foreground"
                  style={{ fontSize: 13 }}
                >
                  {record.excuse_note}
                </p>
              </div>
            )}
          </div>

          {/* Footer — only when a relevant excuse flag is actually set, since
              excused_at/excused_by are re-stamped on every toggle, including
              turning an excuse off. */}
          {reasonLabels.length > 0 && record.excused_by && (
            <div className="flex items-center gap-1.5 p-5 border-t border-border/30 bg-muted/5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                {arabicSource("attendance.excused_by")} {record.excused_by}
                {excusedDate ? ` — ${excusedDate}${excusedTime ? ` ${excusedTime}` : ""}` : ""}
              </p>
            </div>
          )}
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default ExcuseInfoPopover;
