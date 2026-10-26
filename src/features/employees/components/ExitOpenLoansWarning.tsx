import { memo } from "react";
import { AlertTriangle } from "lucide-react";
import { formatNumber } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { ExitOpenLoans } from "@/shared/hooks";

type ExitOpenLoansWarningProps = {
  loans: ExitOpenLoans;
};

/**
 * Loans the leaving employee still owes, shown while settling. The balance is
 * reported per currency exactly as the backend sends it; Phase 1 neither
 * calculates nor deducts it.
 */
const ExitOpenLoansWarning = ({ loans }: ExitOpenLoansWarningProps) => (
  <div
    className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1"
    data-exit-open-loans={loans.count}
  >
    <p className="flex items-center gap-2 text-amber-400" style={{ fontSize: 13 }}>
      <AlertTriangle className="w-4 h-4" />
      {arabicSource("lifecycle.exit_open_loans_title")} ({formatNumber(loans.count)})
    </p>
    <ul className="text-foreground" style={{ fontSize: 13 }}>
      {Object.entries(loans.remaining).map(([currency, amount]) => (
        <li key={currency} dir="ltr">{formatNumber(amount)} {currency}</li>
      ))}
    </ul>
    <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("lifecycle.exit_open_loans_note")}</p>
  </div>
);

export default memo(ExitOpenLoansWarning);
