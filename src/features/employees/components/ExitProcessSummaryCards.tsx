import { memo } from "react";
import { formatNumber } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { DbExitProcess } from "@/shared/hooks";
import { EXIT_ESIGN_STATE_KEYS } from "../utils/exitStages";

type ExitProcessSummaryCardsProps = {
  proc: DbExitProcess;
  completedCount: number;
  totalCount: number;
  cardCls: string;
};

const money = (amount: number | null, currency: string): string =>
  amount ? `${formatNumber(Number(amount))} ${currency}` : "—";

const ExitProcessSummaryCards = ({ proc, completedCount, totalCount, cardCls }: ExitProcessSummaryCardsProps) => {
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const approvedBy = proc.approved_by_user_name || proc.approved_by;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className={`${cardCls} p-4`}>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("lifecycle.end_of_service_benefits")}</p>
        <p className="text-gradient-gold mt-1" style={{ fontSize: 22 }} dir="ltr">
          {money(proc.eos_amount, proc.eos_currency)}
        </p>
      </div>
      <div className={`${cardCls} p-4`}>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.last_working_day")}</p>
        <p className="text-foreground mt-1" style={{ fontSize: 16 }} dir="ltr">{proc.last_working_day || proc.exit_date}</p>
      </div>
      <div className={`${cardCls} p-4`}>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("common.disclaimer")}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-foreground" style={{ fontSize: 16 }}>{completedCount}/{totalCount}</span>
          <div className="flex-1 h-2 rounded-full bg-muted/30">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>{pct}%</span>
        </div>
      </div>
      <div className={`${cardCls} p-4`}>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("lifecycle.exit_final_settlement_amount")}</p>
        <p className="text-foreground mt-1" style={{ fontSize: 16 }} dir="ltr">
          {money(proc.final_settlement_amount, proc.eos_currency)}
        </p>
        {approvedBy && (
          <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
            {arabicSource("lifecycle.exit_approved_by")}: <span dir="auto">{approvedBy}</span>
          </p>
        )}
      </div>
      <div className={`${cardCls} p-4`} data-exit-esign={proc.esign.state}>
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("lifecycle.exit_esign")}</p>
        <p className="text-foreground mt-1" style={{ fontSize: 16 }}>
          {arabicSource(EXIT_ESIGN_STATE_KEYS[proc.esign.state] ?? "lifecycle.exit_esign_not_required")}
        </p>
      </div>
    </div>
  );
};

export default memo(ExitProcessSummaryCards);
