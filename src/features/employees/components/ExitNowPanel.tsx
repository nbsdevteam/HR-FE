import { memo, useCallback, useState } from "react";
import { Ban, CheckCircle2, Target } from "lucide-react";
import { formatDate } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { DbExitProcess, ExitRequiredItem, ExitStatus } from "@/shared/hooks";
import type { ExitDecisionActions } from "../hooks/useExitDecisionActions";
import { isHeldRequiredItem, type ExitRowAction } from "../utils/exitProgress";
import ExitDecisionDialog from "./ExitDecisionDialog";
import ExitRequiredItemRow from "./ExitRequiredItemRow";
import ExitStageBlockerNote from "./ExitStageBlockerNote";
import ExitWaitingOnChips from "./ExitWaitingOnChips";

type ExitNowPanelProps = {
  proc: DbExitProcess;
  statusLabels: Record<string, string>;
  categoryLabels: Record<string, string>;
  /** Checklist lines the user may tick by hand now (see `useExitChecklistView`). */
  toggleableLineIds: ReadonlySet<string>;
  busy: boolean;
  decisionActions: ExitDecisionActions;
  cardCls: string;
  onTransition: (processId: string, status: ExitStatus) => void;
  onChecklistToggle: (checklistId: string, completed: boolean) => void;
};

type DecisionKind = "approve" | "reject";

/** The move each transition button makes; the backend decides whether the user may press it. */
const TRANSITION_TARGETS: Partial<Record<ExitRowAction, ExitStatus>> = {
  submit: "approval",
  start_settlement: "settlement",
  complete: "completed",
};

/**
 * Where the process is and what is left in this stage, as the backend's
 * `progress` says it: the owners waiting, then every required item with the
 * button for it on its own row. A closed process shows its closing date instead.
 */
const ExitNowPanel = ({
  proc, statusLabels, categoryLabels, toggleableLineIds, busy, decisionActions, cardCls, onTransition, onChecklistToggle,
}: ExitNowPanelProps) => {
  const [dialog, setDialog] = useState<DecisionKind | null>(null);
  const [acting, setActing] = useState(false);
  const { progress, my_actions: myActions } = proc;
  const closedAt = proc.status === "completed" ? proc.completed_at : proc.status === "cancelled" ? proc.cancelled_at : null;
  const isClosed = proc.status === "completed" || proc.status === "cancelled";
  // Why a move is still held that the rows above do not say: unconfirmed clearance approvals, an unsigned e-sign.
  const blockerCodes = Array.from(new Set(Object.values(proc.transition_blockers).flat()));

  const handleDialogClose = useCallback((): void => setDialog(null), []);

  const run = useCallback(async (action: () => Promise<boolean>): Promise<void> => {
    setActing(true);
    await action();
    setActing(false);
  }, []);

  const handleAction = useCallback((action: ExitRowAction, item: ExitRequiredItem): void => {
    const target = TRANSITION_TARGETS[action];
    if (target) return onTransition(proc.id, target);
    if (action === "approve" || action === "reject") return setDialog(action);
    if (action === "confirm") return void run(() => decisionActions.confirmSettlement(proc.id));
    if (action === "issue") return void run(() => decisionActions.issueLink(proc.id));
    if (action === "tick" && item.line_id) onChecklistToggle(item.line_id, true);
  }, [decisionActions, onChecklistToggle, onTransition, proc.id, run]);

  const handleDecision = useCallback(async (comment: string): Promise<void> => {
    setActing(true);
    const decided = dialog === "reject"
      ? await decisionActions.reject(proc.id, comment)
      : await decisionActions.approve(proc.id, comment);
    setActing(false);
    if (decided) setDialog(null);
  }, [decisionActions, dialog, proc.id]);

  return (
    <section className={`${cardCls} p-5 space-y-3`} data-exit-now={proc.status}>
      <h3 className="flex flex-wrap items-center gap-2 text-foreground">
        <Target className="w-5 h-5 text-primary" />
        {isClosed ? (
          <span>
            {arabicSource(proc.status === "completed" ? "lifecycle.exit_progress_completed_on" : "lifecycle.exit_progress_cancelled_on")}{" "}
            <span dir="ltr">{closedAt ? formatDate(closedAt) : "—"}</span>
          </span>
        ) : (
          <>
            <span><span className="capitalize">{arabicSource("shared.now")}</span>: {statusLabels[proc.status] ?? proc.status}</span>
            <span className="text-muted-foreground" style={{ fontSize: 12 }}>· {arabicSource("employees.lifecycle_waiting_on")}</span>
            <ExitWaitingOnChips waitingOn={progress.waiting_on} categoryLabels={categoryLabels} />
          </>
        )}
      </h3>
      {!isClosed && (
        <ul>
          {progress.still_required.map((item, index) => (
            <ExitRequiredItemRow
              key={`${index}-${item.code}-${item.line_id ?? item.custody_id ?? ""}`}
              item={item}
              held={isHeldRequiredItem(item, index)}
              canTick={item.line_id !== null && toggleableLineIds.has(item.line_id)}
              myActions={myActions}
              categoryLabels={categoryLabels}
              busy={busy || acting}
              onAction={handleAction}
            />
          ))}
        </ul>
      )}
      {!isClosed && blockerCodes.map(code => (
        <ExitStageBlockerNote key={code} code={code} />
      ))}
      {dialog && (
        <ExitDecisionDialog
          title={dialog === "reject" ? arabicSource("lifecycle.exit_approval_reject_title") : arabicSource("lifecycle.exit_approval_approve_title")}
          confirmLabel={dialog === "reject" ? arabicSource("lifecycle.exit_approval_reject") : arabicSource("lifecycle.exit_approval_approve")}
          icon={dialog === "reject" ? Ban : CheckCircle2}
          commentRequired={dialog === "reject"}
          destructive={dialog === "reject"}
          submitting={acting}
          onClose={handleDialogClose}
          onSubmit={handleDecision}
        />
      )}
    </section>
  );
};

export default memo(ExitNowPanel);
