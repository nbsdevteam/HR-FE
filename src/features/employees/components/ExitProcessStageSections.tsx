import { memo } from "react";
import { formatDate } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { DbExitProcess } from "@/shared/hooks";
import type { ExitChecklistView } from "../hooks/useExitChecklistView";
import type { ExitClearanceActions } from "../hooks/useExitClearanceActions";
import type { ExitDecisionActions } from "../hooks/useExitDecisionActions";
import { exitStageState } from "../utils/exitProgress";
import ExitApprovalPanel from "./ExitApprovalPanel";
import ExitClearanceChecklist from "./ExitClearanceChecklist";
import ExitSettlementPanel from "./ExitSettlementPanel";
import ExitSigningPanel from "./ExitSigningPanel";
import ExitStageSection from "./ExitStageSection";

type ExitProcessStageSectionsProps = {
  proc: DbExitProcess;
  checklistView: ExitChecklistView;
  clearanceActions: ExitClearanceActions;
  decisionActions: ExitDecisionActions;
  canRecalculate: boolean;
  onChecklistToggle: (checklistId: string, completed: boolean) => void;
  cardCls: string;
};

const approvalSummary = (proc: DbExitProcess): string =>
  (proc.approval?.steps ?? [])
    .filter(step => step.acted_by_name)
    .map(step => `${step.name} ✓ ${step.acted_by_name}`)
    .join(" · ");

/**
 * The record's stages in process order: approval, clearance, settlement, final
 * approval. Finished ones fold to a one-line summary, the current one is open
 * and later ones are a grey title.
 */
const ExitProcessStageSections = ({
  proc, checklistView, clearanceActions, decisionActions, canRecalculate, onChecklistToggle, cardCls,
}: ExitProcessStageSectionsProps) => {
  const canEdit = proc.my_actions.includes("edit");
  // A process sent back for correction is back at in progress, but its approval trail and reason stay readable.
  const sentBack = proc.approval !== null && proc.status === "in_progress";
  const settlement = proc.settlement;

  return (
    <>
      <ExitStageSection
        title={arabicSource("lifecycle.exit_approval_title")}
        state={exitStageState(proc, "approval")}
        summary={approvalSummary(proc)}
        expandable={proc.approval !== null}
        startOpen={sentBack}
        cardCls={cardCls}
      >
        <ExitApprovalPanel proc={proc} cardCls="" />
      </ExitStageSection>

      <ExitStageSection
        title={arabicSource("lifecycle.disclaimer_list")}
        state={exitStageState(proc, "clearance")}
        summary={`${checklistView.completedCount}/${checklistView.totalCount}`}
        cardCls={cardCls}
      >
        <ExitClearanceChecklist view={checklistView} clearanceActions={clearanceActions} onChecklistToggle={onChecklistToggle} />
      </ExitStageSection>

      <ExitStageSection
        title={arabicSource("lifecycle.exit_settlement_title")}
        state={exitStageState(proc, "settlement")}
        summary={settlement?.confirmed ? `${settlement.confirmed_by_name} ${settlement.confirmed_at ? formatDate(settlement.confirmed_at) : ""}` : undefined}
        expandable={canEdit}
        cardCls={cardCls}
      >
        <ExitSettlementPanel
          proc={proc}
          canReopen={proc.my_actions.includes("reopen_settlement")}
          canRecalculate={canRecalculate}
          canPreview={canEdit}
          actions={decisionActions}
          cardCls=""
        />
        <ExitSigningPanel proc={proc} canIssue={proc.my_actions.includes("issue_signature")} actions={decisionActions} cardCls="" />
      </ExitStageSection>

      <ExitStageSection
        title={arabicSource("lifecycle.task_title_final_approval")}
        state={exitStageState(proc, "completed")}
        summary={proc.approved_by_user_name ? `${proc.approved_by_user_name} ${proc.approved_at ? formatDate(proc.approved_at) : ""}` : undefined}
        cardCls={cardCls}
      >
        <p className="text-muted-foreground" style={{ fontSize: 13 }} dir="auto">
          {proc.approved_by_user_name || "—"}{proc.approved_at && <> · <span dir="ltr">{formatDate(proc.approved_at)}</span></>}
        </p>
      </ExitStageSection>
    </>
  );
};

export default memo(ExitProcessStageSections);
