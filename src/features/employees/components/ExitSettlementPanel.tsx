import { useCallback, useState } from "react";
import { Calculator, LockOpen, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components";
import * as odooData from "@/shared/api/odooData";
import { formatDateTime } from "@/i18n/format";
import { localizedAlert } from "@/i18n/native";
import { arabicSource } from "@/i18n/source";
import type { DbExitProcess, ExitSettlement } from "@/shared/hooks";
import type { ExitDecisionActions } from "../hooks/useExitDecisionActions";
import { exitProcessErrorMessage } from "../utils/exitProcessErrorMessage";
import ExitSettlementStatement from "./ExitSettlementStatement";

type ExitSettlementPanelProps = {
  proc: DbExitProcess;
  /** The backend lists `reopen_settlement` for the user; Confirm is a button on the Now panel's row. */
  canReopen: boolean;
  /** Finance or HR may rebuild a statement that is not confirmed yet. */
  canRecalculate: boolean;
  /** HR may preview the estimate before settlement starts. */
  canPreview: boolean;
  actions: ExitDecisionActions;
  cardCls: string;
};

/**
 * The settlement statement. The server calculates it when settlement starts,
 * Finance confirms it, and a confirmed statement is what the employee signs —
 * nothing here edits or computes an amount. Before settlement, HR can read a
 * not-saved estimate.
 */
const ExitSettlementPanel = ({ proc, canReopen, canRecalculate, canPreview, actions, cardCls }: ExitSettlementPanelProps) => {
  const [busy, setBusy] = useState(false);
  const [estimate, setEstimate] = useState<ExitSettlement | null>(null);
  const { settlement } = proc;
  const open = proc.status !== "completed" && proc.status !== "cancelled";

  const run = useCallback(async (action: () => Promise<boolean>): Promise<void> => {
    setBusy(true);
    await action();
    setBusy(false);
  }, []);

  const handleReopen = useCallback((): Promise<void> => run(() => actions.reopenSettlement(proc.id)), [actions, proc.id, run]);
  const handleRecalculate = useCallback((): Promise<void> => run(() => actions.recalculate(proc.id)), [actions, proc.id, run]);

  const handlePreview = useCallback(async (): Promise<void> => {
    setBusy(true);
    try {
      const result = await odooData.fetchExitSettlement(proc.id);
      setEstimate(result.estimate ?? result.statement);
    } catch (error: unknown) {
      localizedAlert(exitProcessErrorMessage(error, "lifecycle.exit_error_decision_failed"));
    }
    setBusy(false);
  }, [proc.id]);

  const shown = settlement ?? estimate;
  if (!settlement && !(canPreview && open)) return null;

  return (
    <section className={`${cardCls} p-5 space-y-3`} data-exit-settlement={settlement ? (settlement.confirmed ? "confirmed" : "open") : "estimate"}>
      <h3 className="flex items-center gap-2 text-foreground">
        <Calculator className="w-5 h-5 text-primary" />
        {arabicSource("lifecycle.exit_settlement_title")}
      </h3>
      {!settlement && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" icon={RefreshCw} loading={busy} onClick={handlePreview} data-exit-settlement-preview>
            {arabicSource("lifecycle.exit_settlement_preview")}
          </Button>
          {estimate && <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("lifecycle.exit_settlement_estimate_note")}</span>}
        </div>
      )}
      {shown && <ExitSettlementStatement statement={shown} />}
      {settlement && (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {settlement.computed_at && <>{arabicSource("lifecycle.exit_settlement_computed_at")}: <span dir="ltr">{formatDateTime(settlement.computed_at, { timeZone: "Asia/Baghdad" })}</span></>}
          {settlement.confirmed && (
            <> · {arabicSource("lifecycle.exit_settlement_confirmed_by")}: <span dir="auto">{settlement.confirmed_by_name}</span>
              {settlement.confirmed_at && <> (<span dir="ltr">{formatDateTime(settlement.confirmed_at, { timeZone: "Asia/Baghdad" })}</span>)</>}
            </>
          )}
        </p>
      )}
      {settlement && open && (
        <div className="flex flex-wrap gap-2">
          {!settlement.confirmed && canRecalculate && (
            <Button variant="outline" size="sm" icon={RefreshCw} disabled={busy} onClick={handleRecalculate} data-exit-settlement-recalculate>
              {arabicSource("lifecycle.exit_settlement_recalculate")}
            </Button>
          )}
          {settlement.confirmed && canReopen && (
            <Button variant="outline" size="sm" icon={LockOpen} loading={busy} onClick={handleReopen} data-exit-settlement-reopen>
              {arabicSource("lifecycle.exit_settlement_reopen")}
            </Button>
          )}
        </div>
      )}
    </section>
  );
};

export default ExitSettlementPanel;
