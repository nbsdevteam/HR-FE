import { AlertTriangle } from "lucide-react";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";

/** `accrual_excluded_reason` → localized explanation (backend §6). */
const ACCRUAL_EXCLUDED_REASON_KEYS: Record<string, ArabicSourceKey> = {
  no_joining_date: "leave.accrual_excluded_no_joining_date",
};

type LeaveAccrualExcludedBannerProps = {
  reason: string | null;
};

/**
 * Shown instead of a `0` balance when the backend reports the employee is
 * skipped by accrual entirely (backend §6) — a `0` alone reads as "no leave
 * earned yet" rather than "accrual cannot run for this employee".
 */
const LeaveAccrualExcludedBanner = ({ reason }: LeaveAccrualExcludedBannerProps) => {
  const message = (reason && ACCRUAL_EXCLUDED_REASON_KEYS[reason])
    ? arabicSource(ACCRUAL_EXCLUDED_REASON_KEYS[reason])
    : arabicSource("leave.accrual_excluded_generic");

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
      <div className="space-y-1">
        <p className="text-amber-400" style={{ fontSize: 13 }}>
          {arabicSource("leave.accrual_excluded_title")}
        </p>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {message}
        </p>
      </div>
    </div>
  );
};

export default LeaveAccrualExcludedBanner;
