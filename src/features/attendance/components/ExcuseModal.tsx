import { useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { ModalOverlay } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { AttendanceRow, ExcuseForm } from "@/features/attendance/types";
import ExcuseToggleRow from "./ExcuseToggleRow";

type ExcuseModalProps = {
  excuseModal: { record: AttendanceRow } | null;
  excuseForm: ExcuseForm;
  excuseSaving: boolean;
  onClose: () => void;
  onExcuseFormChange: (value: ExcuseForm | ((current: ExcuseForm) => ExcuseForm)) => void;
  onSave: () => void;
};

const ExcuseModal = ({ excuseModal, excuseForm, excuseSaving, onClose, onExcuseFormChange, onSave }: ExcuseModalProps) => {
  const setExcuseModal = (value: null) => { if (value === null) onClose(); };
  const setExcuseForm = onExcuseFormChange;
  const handleSaveExcuse = onSave;
  const toggleExcuse = (key: keyof Omit<ExcuseForm, "note">) => {
    setExcuseForm(f => ({ ...f, [key]: !f[key] }));
  };

  const handleCloseExcuseModal = useCallback(() => setExcuseModal(null), [onClose]);

  const execuseData = [
    { key: "late" as const, label: arabicSource("attendance.excuse_for_delay"), desc: arabicSource("attendance.late_salary_will_not_be_counted"), show: (excuseModal?.record.lateMinutes || 0) > 0 || excuseModal?.record.status === arabicSource("common.late") },
    { key: "shortfall" as const, label: arabicSource("attendance.excuse_of_lack_of_hours"), desc: arabicSource("attendance.short_hours_for_this_day_will_not_be_deducted"), show: true },
    { key: "absence" as const, label: arabicSource("attendance.absence_excuse"), desc: arabicSource("attendance.this_day_will_not_be_counted_as_an_absence"), show: excuseModal?.record.status === arabicSource("common.absent") || excuseModal?.record.rawStatus === "absent" },
  ];

  return (
    <>
    {/* Excuse Modal */}
    <AnimatePresence>
      {excuseModal && (
        <ModalOverlay
          onClose={handleCloseExcuseModal}
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
              <h3 className="text-foreground" style={{ fontSize: 16 }}>{arabicSource("attendance.employee_s_excuse")}</h3>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize: 12 }}>
                {excuseModal.record.employee} — {excuseModal.record.date}
              </p>
            </div>
            <button onClick={() => setExcuseModal(null)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Info chips */}
            <div className="flex flex-wrap gap-2" style={{ fontSize: 12 }}>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {arabicSource("attendance.attendance")} {excuseModal.record.checkIn || "—"}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {arabicSource("attendance.dismissal")} {excuseModal.record.checkOut || "—"}
              </span>
              {excuseModal.record.lateMinutes > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {arabicSource("attendance.delay")} {excuseModal.record.lateMinutes} {arabicSource("common.min")}
                </span>
              )}
            </div>

            {/* Excuse toggles */}
            <div className="space-y-3">
                {execuseData.filter(t => t.show).map(toggle => (
                  <ExcuseToggleRow
                    key={toggle.key}
                    item={toggle}
                    checked={excuseForm[toggle.key]}
                    onToggle={toggleExcuse}
                  />
                ))}
            </div>

            {/* Note */}
            <div>
              <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>{arabicSource("attendance.reason_for_excuse")}</label>
              <textarea
                value={excuseForm.note}
                onChange={(e) => setExcuseForm(f => ({ ...f, note: e.target.value }))}
                placeholder={arabicSource("attendance.enter_the_reason_for_the_excuse")}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-primary outline-none resize-none"
                style={{ fontSize: 13 }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-5 border-t border-border/30 bg-muted/5">
            {excuseModal.record.excuseNote && (
              <p className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource("attendance.latest_excuse")} {excuseModal.record.excuseNote.substring(0, 40)}</p>
            )}
            <div className="flex items-center gap-2 ms-auto">
              <button
                onClick={() => setExcuseModal(null)}
                className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                style={{ fontSize: 13 }}
              >
                {arabicSource("common.cancel")}
              </button>
              <button
                onClick={handleSaveExcuse}
                disabled={excuseSaving}
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                style={{ fontSize: 13 }}
              >
                {excuseSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {arabicSource("attendance.save_excuses")}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </AnimatePresence>
    </>
  );
};

export default ExcuseModal;
