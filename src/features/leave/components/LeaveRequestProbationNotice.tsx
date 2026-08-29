import { CalendarClock, Info } from "lucide-react";
import { arabicSource } from "@/i18n/source";

type LeaveRequestProbationNoticeProps = {
  blockedByProbation: boolean;
  probationEndDate: string | null;
  /** Earliest date the request may start — `probation_end_date + 1 day`. */
  minStartDate: string;
  /** First accrual date, when nothing has been granted yet. */
  firstAccrualOn: string;
  outOfBalance: boolean;
};

/**
 * Why the selected leave type is limited: probation window, the earliest start
 * date the backend would accept, an empty accrual, or a spent balance.
 */
const LeaveRequestProbationNotice = ({
  blockedByProbation,
  probationEndDate,
  minStartDate,
  firstAccrualOn,
  outOfBalance,
}: LeaveRequestProbationNoticeProps) => {
  if (!blockedByProbation && !firstAccrualOn && !outOfBalance) return null;

  return (
    <div className="space-y-2">
      {blockedByProbation && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-amber-400" style={{ fontSize: 12 }}>
            {arabicSource("leave.error_probation_block")}{" "}
            {probationEndDate && (
              <>
                {arabicSource("leave.probation_ends_on")}{" "}
                <span dir="ltr">{probationEndDate}</span>.{" "}
              </>
            )}
            {minStartDate && (
              <>
                {arabicSource("leave.earliest_start_date")}{" "}
                <span dir="ltr">{minStartDate}</span>
              </>
            )}
          </p>
        </div>
      )}

      {firstAccrualOn && (
        <div className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 border border-border/40">
          <CalendarClock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            {arabicSource("leave.first_accrual_on")}{" "}
            <span dir="ltr">{firstAccrualOn}</span>
          </p>
        </div>
      )}

      {outOfBalance && (
        <p className="text-destructive" style={{ fontSize: 12 }}>
          {arabicSource("leave.no_balance_remaining")}
        </p>
      )}
    </div>
  );
};

export default LeaveRequestProbationNotice;
