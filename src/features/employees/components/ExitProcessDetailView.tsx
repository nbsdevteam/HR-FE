import { useCallback, useState } from "react";
import { AnimatePresence } from "motion/react";
import { usePermissions } from "@/shared/auth/permissions";
import { empDisplayName, type DbEmployee, type DbExitChecklistItem, type DbExitProcess, type ExitStatus } from "@/shared/hooks";
import type { ExitDecisionActions } from "../hooks/useExitDecisionActions";
import { useExitChecklistView } from "../hooks/useExitChecklistView";
import type { ExitChecklistLine } from "../types/lifecycle";
import { exitStageDates } from "../utils/exitProgress";
import ExitClearanceNotice from "./ExitClearanceNotice";
import ExitNowPanel from "./ExitNowPanel";
import ExitOpenLoansWarning from "./ExitOpenLoansWarning";
import ExitProcessEditPanel, { type ExitEditPayload } from "./ExitProcessEditPanel";
import ExitProcessHeader from "./ExitProcessHeader";
import ExitProcessStageSections from "./ExitProcessStageSections";
import ExitProcessSummaryCards from "./ExitProcessSummaryCards";
import ExitProgressStepper from "./ExitProgressStepper";

/** Before settlement the loans are a warning; from settlement on they are `loan` lines in the statement. */
const OPEN_LOANS_WARNING_STAGES: readonly string[] = ["in_progress", "approval", "clearance"];

type ExitProcessDetailViewProps = {
  proc: DbExitProcess;
  emp: DbEmployee | undefined;
  checklist: ExitChecklistLine[];
  exitItems: DbExitChecklistItem[];
  categoryLabels: Record<string, string>;
  exitTypeLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  cardCls: string;
  inputCls: string;
  busy: boolean;
  /** The approval, settlement and signing-link actions; the panels are inert without them. */
  decisionActions: ExitDecisionActions;
  onBack: () => void;
  onTransition: (processId: string, status: ExitStatus) => void;
  onEditSave: (processId: string, payload: ExitEditPayload) => Promise<boolean>;
  onChecklistToggle: (checklistId: string, completed: boolean) => void;
};

/**
 * One End of Service: the stepper and the Now panel say where it stands and what
 * is left, then the stages follow in order. Buttons are the backend's `my_actions`.
 */
const ExitProcessDetailView = ({
  proc, emp, checklist, exitItems, categoryLabels, exitTypeLabels, statusLabels, statusColors, cardCls,
  inputCls, busy, decisionActions, onBack, onTransition, onEditSave, onChecklistToggle,
}: ExitProcessDetailViewProps) => {
  const [editing, setEditing] = useState(false);
  const { hasPermission } = usePermissions();
  const canRecalculate = hasPermission("hr.lifecycle.clearance_finance") || hasPermission("hr.lifecycle.edit");

  const checklistView = useExitChecklistView(checklist, exitItems, categoryLabels);

  const handleEditOpen = useCallback((): void => setEditing(true), []);
  const handleEditCancel = useCallback((): void => setEditing(false), []);
  const handleEditSave = useCallback(async (payload: ExitEditPayload): Promise<void> => {
    if (await onEditSave(proc.id, payload)) setEditing(false);
  }, [onEditSave, proc.id]);
  const handleCancelProcess = useCallback((): void => {
    onTransition(proc.id, "cancelled");
  }, [onTransition, proc.id]);

  const employeeName = emp ? empDisplayName(emp) : proc.employee_name || "—";

  return (
    <div className="space-y-4">
      <ExitProcessHeader
        proc={proc}
        employeeName={employeeName}
        exitTypeLabel={exitTypeLabels[proc.exit_type] || proc.exit_type}
        statusLabel={statusLabels[proc.status] || proc.status}
        statusColor={statusColors[proc.status] || ""}
        editing={editing}
        busy={busy}
        onBack={onBack}
        onEditOpen={handleEditOpen}
        onCancel={handleCancelProcess}
      />

      <AnimatePresence>
        {editing && (
          <ExitProcessEditPanel
            proc={proc}
            exitTypeLabels={exitTypeLabels}
            saving={busy}
            cardCls={cardCls}
            inputCls={inputCls}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
          />
        )}
      </AnimatePresence>

      <ExitProgressStepper
        stages={proc.progress.stages}
        statusLabels={statusLabels}
        size="lg"
        daysInStage={proc.progress.days_in_stage}
        dates={exitStageDates(proc)}
      />

      <ExitNowPanel
        proc={proc}
        statusLabels={statusLabels}
        categoryLabels={categoryLabels}
        toggleableLineIds={checklistView.toggleableLineIds}
        busy={busy}
        decisionActions={decisionActions}
        cardCls={cardCls}
        onTransition={onTransition}
        onChecklistToggle={onChecklistToggle}
      />

      <ExitProcessSummaryCards proc={proc} cardCls={cardCls} />

      {OPEN_LOANS_WARNING_STAGES.includes(proc.status) && proc.warnings.open_loans && (
        <ExitOpenLoansWarning loans={proc.warnings.open_loans} />
      )}

      <ExitClearanceNotice proc={proc} cardCls={cardCls} />

      <ExitProcessStageSections
        proc={proc}
        checklistView={checklistView}
        decisionActions={decisionActions}
        canRecalculate={canRecalculate}
        onChecklistToggle={onChecklistToggle}
        cardCls={cardCls}
      />
    </div>
  );
};

export default ExitProcessDetailView;
