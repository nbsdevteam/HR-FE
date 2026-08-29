import { XCircle } from "lucide-react";
import type { ProcessedAttendanceRecord } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { ModalOverlay } from "@/shared/components";
import PopoverHeader from "./shared/PopoverHeader";
import PopoverFooterBar from "./shared/PopoverFooterBar";
import AbsenceRecordRow from "./AbsenceRecordRow";
import { memo } from "react";

const REASON_LABELS: Record<string, string> = {
  no_punches: arabicSource("payroll.no_fingerprint"),
  late_threshold: arabicSource("payroll.excessive_delay"),
  checkout_without_checkin: arabicSource("payroll.leaving_without_attending"),
};

const AbsencePopover = ({
  records,
  onClose,
  onExcuse,
}: {
  records: ProcessedAttendanceRecord[];
  onClose: () => void;
  onExcuse: (id: string) => void;
}) => {
  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
      contentMotionProps={{
        initial: { scale: 0.95 },
        animate: { scale: 1 },
        exit: { scale: 0.95 },
      }}
    >
      <PopoverHeader
        icon={XCircle}
        iconBgClassName="bg-destructive/10"
        iconColorClassName="text-destructive"
        title={arabicSource("payroll.absence_details")}
        subtitle={arabicSource("payroll.days_of_absence_during_the_month")}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {records.map((rec) => (
          <AbsenceRecordRow
            key={rec.id}
            rec={rec}
            reasonLabels={REASON_LABELS}
            onExcuse={onExcuse}
          />
        ))}
      </div>

      <PopoverFooterBar>
        <span className="text-destructive" style={{ fontSize: 12 }}>
          {arabicSource("payroll.total")} {records.length}{" "}
          {arabicSource("common.days_2")}
        </span>
        <span className="text-emerald-400" style={{ fontSize: 12 }}>
          {arabicSource("common.excused")}{" "}
          {records.filter((r) => r.excusedAbsence).length}
        </span>
      </PopoverFooterBar>
    </ModalOverlay>
  );
};

export default memo(AbsencePopover);
