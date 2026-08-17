import { TreePalm } from "lucide-react";
import type { ProcessedAttendanceRecord } from "@/features/payroll";
import { arabicSource } from "@/i18n/source";
import { payrollCardClass as cardCls } from "../styles";
import PayrollLeaveDayRow from "./PayrollLeaveDayRow";

type PayrollLeaveDaysCardProps = {
  leaveRecs: ProcessedAttendanceRecord[];
  paidLeaveCount: number;
  unpaidLeaveCount: number;
};

const PayrollLeaveDaysCard = ({ leaveRecs, paidLeaveCount, unpaidLeaveCount }: PayrollLeaveDaysCardProps) => (
  <div className={`${cardCls} p-5`}>
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <TreePalm className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <h3 className="text-foreground">{arabicSource("payroll.approved_vacation_days")}</h3>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {paidLeaveCount > 0 && `${paidLeaveCount} ${arabicSource("payroll.day_with_salary")}`}
          {paidLeaveCount > 0 && unpaidLeaveCount > 0 && " — "}
          {unpaidLeaveCount > 0 && <span className="text-destructive">{unpaidLeaveCount} {arabicSource("payroll.day_without_pay_deducted")}</span>}
        </p>
      </div>
    </div>
    <div className="space-y-1.5">
      {leaveRecs.map((rec) => (
        <PayrollLeaveDayRow key={rec.id} rec={rec} />
      ))}
    </div>
  </div>
);

export default PayrollLeaveDaysCard;
