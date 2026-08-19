import { StatusBadge } from "@/shared/components";
import type { ProcessedAttendanceRecord } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { dayNamesAr } from "../styles";

type PayrollLeaveDayRowProps = {
  rec: ProcessedAttendanceRecord;
};

const PayrollLeaveDayRow = ({ rec }: PayrollLeaveDayRowProps) => (
  <div
    className={`flex items-center justify-between py-2 px-3 rounded-lg border ${
      rec.isUnpaidLeave
        ? "bg-destructive/5 border-destructive/15"
        : "bg-blue-500/5 border-blue-500/15"
    }`}
  >
    <div className="flex items-center gap-3">
      <span className="text-foreground" style={{ fontSize: 12 }}>{rec.date}</span>
      <span className="text-muted-foreground" style={{ fontSize: 11 }}>{dayNamesAr[rec.dayOfWeek] || rec.dayOfWeek}</span>
    </div>
    <div className="flex items-center gap-2">
      <StatusBadge
        colorClassName={
          rec.isUnpaidLeave
            ? "bg-destructive/10 text-destructive border-destructive/20"
            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
        }
        fontSize={10}
        extraClassName="text-center"
      >
        {rec.leaveType}
      </StatusBadge>
      {rec.isUnpaidLeave && (
        <span className="text-destructive" style={{ fontSize: 10 }}>{arabicSource("common.discounted")}</span>
      )}
    </div>
  </div>
);

export default PayrollLeaveDayRow;
