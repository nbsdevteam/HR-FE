import { ArrowDownRight } from "lucide-react";
import {
  formatHoursMinutes,
  type ProcessedAttendanceRecord,
} from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { ModalOverlay } from "@/shared/components";
import PopoverHeader from "./shared/PopoverHeader";
import PopoverFooterBar from "./shared/PopoverFooterBar";
import ShortfallTableHeaderRow from "./ShortfallTableHeaderRow";
import ShortfallTableRow from "./ShortfallTableRow";
import { SHORTFALL_TABLE_HEADINGS } from "../data";
import { memo } from "react";

interface ShortfallPopoverProps {
  records: ProcessedAttendanceRecord[];
  targetHours: number;
  onClose: () => void;
  onExcuse: (id: string) => void;
}

const ShortfallPopover = ({
  records,
  targetHours,
  onClose,
  onExcuse,
}: ShortfallPopoverProps) => {
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
      <PopoverHeader
        icon={ArrowDownRight}
        iconBgClassName="bg-amber-500/10"
        iconColorClassName="text-amber-400"
        title={arabicSource("payroll.details_of_the_watch_shortage")}
        subtitle={`${arabicSource("payroll.days_when_working_hours_are_less_than")} ${targetHours} ${arabicSource("payroll.hours")}`}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead>
            <ShortfallTableHeaderRow headings={SHORTFALL_TABLE_HEADINGS} />
          </thead>
          <tbody>
            {records.map((rec) => (
              <ShortfallTableRow
                key={rec.id}
                rec={rec}
                targetHours={targetHours}
                onExcuse={onExcuse}
              />
            ))}
          </tbody>
        </table>
      </div>

      <PopoverFooterBar>
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("payroll.total_deficiency")}{" "}
          <span className="text-amber-400">
            {formatHoursMinutes(
              records.reduce(
                (s, r) => s + Math.max(0, targetHours - r.workingHours),
                0,
              ),
            )}
          </span>
        </span>
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("common.excused")}{" "}
          {records?.filter((r) => r.excusedShortfall).length} / {records.length}
        </span>
      </PopoverFooterBar>
    </ModalOverlay>
  );
};

export default memo(ShortfallPopover);
