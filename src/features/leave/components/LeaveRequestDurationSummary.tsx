import { CalendarDays } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { formatLeaveDays } from "../utils/accrual";

type LeaveRequestDurationSummaryProps = {
  days: number;
  remainingBalance: number | null;
  /** Non-blocking "over balance" hint — Odoo decides against the work calendar. */
  warning?: string;
};

/**
 * "Duration: N days" strip with the employee's remaining balance alongside.
 *
 * A half day is `days = 0.5` — the same number the backend books and the
 * payslip reads — rather than a separate wording, so the two cannot disagree
 * (half-day handoff §5.4, §6). Both numbers on this row go through
 * `formatLeaveDays`, so the duration and the balance are formatted alike.
 */
const LeaveRequestDurationSummary = ({
  days,
  remainingBalance,
  warning = "",
}: LeaveRequestDurationSummaryProps) => {
  if (days <= 0) return null;

  const exceedsBalance = remainingBalance !== null && days > remainingBalance;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <span className="text-primary" style={{ fontSize: 13 }}>
            {arabicSource("common.duration_2")} {formatLeaveDays(days)}{" "}
            {arabicSource("common.days_2")}
          </span>
        </div>
        {remainingBalance !== null && (
          <span
            className={exceedsBalance ? "text-destructive" : "text-emerald-400"}
            style={{ fontSize: 12 }}
          >
            {arabicSource("leave.remaining_balance_2")} {formatLeaveDays(remainingBalance)}{" "}
            {arabicSource("common.days_2")}
          </span>
        )}
      </div>
      {warning && (
        <p className="text-amber-400" style={{ fontSize: 12 }}>
          {warning}
        </p>
      )}
    </div>
  );
};

export default LeaveRequestDurationSummary;
