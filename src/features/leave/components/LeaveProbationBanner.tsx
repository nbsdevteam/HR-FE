import { ShieldAlert } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { earliestLeaveStartDate, formatLeaveDays } from "../utils/accrual";

type LeaveProbationBannerProps = {
  probationEndDate: string | null;
  /** Days already accrued — shown so the balance never reads as zero during probation. */
  accruedDays: number;
};

/**
 * Probation callout (backend §10). The accrued figure is deliberately spelled
 * out: the balance is not zero during probation, it is simply unusable until
 * the day after `probation_end_date`.
 */
const LeaveProbationBanner = ({ probationEndDate, accruedDays }: LeaveProbationBannerProps) => {
  if (!probationEndDate) return null;

  const usableFrom = earliestLeaveStartDate(probationEndDate);

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
      <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
      <div className="space-y-1">
        <p className="text-amber-400" style={{ fontSize: 13 }}>
          {arabicSource("leave.on_probation_until")}{" "}
          <span dir="ltr">{probationEndDate}</span>
        </p>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("leave.probation_accrual_note")}{" "}
          <span dir="ltr">{usableFrom}</span>
          {" — "}
          {arabicSource("leave.accrued_days")} {formatLeaveDays(accruedDays)}{" "}
          {arabicSource("common.days_2")}
        </p>
      </div>
    </div>
  );
};

export default LeaveProbationBanner;
