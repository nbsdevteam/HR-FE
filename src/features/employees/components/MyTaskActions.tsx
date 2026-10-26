import { useCallback, useState } from "react";
import { Ban, CheckCircle2, ClipboardCheck, ExternalLink, Flag, Send } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { MyTask } from "@/shared/hooks";
import type { MyTaskActionsBundle } from "../hooks/useMyTaskActions";
import ExitDecisionDialog from "./ExitDecisionDialog";
import MyTaskClearItemRow from "./MyTaskClearItemRow";
import MyTaskSigningLink from "./MyTaskSigningLink";

type MyTaskActionsProps = {
  task: MyTask;
  actions: MyTaskActionsBundle;
};

type DecisionKind = "approve" | "reject";

/** The button(s) for one task's `action`; what each does is the backend's `action`, not a browser rule. */
const MyTaskActions = ({ task, actions }: MyTaskActionsProps) => {
  const [dialog, setDialog] = useState<DecisionKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { busy, decision, openExit, toggleChecklist, transition } = actions;
  const exitId = task.exit_id;

  const handleSubmitForApproval = useCallback((): void => {
    void transition(exitId, "approval");
  }, [exitId, transition]);
  const handleStartSettlement = useCallback((): void => {
    void transition(exitId, "settlement");
  }, [exitId, transition]);
  const handleComplete = useCallback((): void => {
    void transition(exitId, "completed");
  }, [exitId, transition]);
  const handleOpen = useCallback((): void => openExit(exitId), [exitId, openExit]);
  const handleTick = useCallback((lineId: string): void => {
    void toggleChecklist(lineId, true);
  }, [toggleChecklist]);

  const handleApproveOpen = useCallback((): void => setDialog("approve"), []);
  const handleRejectOpen = useCallback((): void => setDialog("reject"), []);
  const handleDialogClose = useCallback((): void => setDialog(null), []);
  const handleDecision = useCallback(async (comment: string): Promise<void> => {
    setSubmitting(true);
    const decided = dialog === "reject"
      ? await decision.reject(exitId, comment)
      : await decision.approve(exitId, comment);
    setSubmitting(false);
    if (decided) setDialog(null);
  }, [decision, dialog, exitId]);

  return (
    <div className="space-y-2" data-task-action={task.action}>
      {task.action === "clear_items" && (
        <ul>
          {task.items.map(item => (
            <MyTaskClearItemRow key={item.line_id} item={item} onTick={handleTick} />
          ))}
        </ul>
      )}
      {task.action === "share_signature_link" && (
        <MyTaskSigningLink exitId={exitId} onIssue={decision.issueLink} busy={busy} />
      )}
      <div className="flex flex-wrap gap-2">
        {task.action === "submit_exit" && (
          <Button variant="info" size="sm" icon={Send} disabled={busy} onClick={handleSubmitForApproval}>
            {arabicSource("lifecycle.exit_submit_for_approval")}
          </Button>
        )}
        {task.action === "approve_exit" && (
          <>
            <Button variant="success" size="sm" icon={CheckCircle2} onClick={handleApproveOpen}>
              {arabicSource("lifecycle.exit_approval_approve")}
            </Button>
            <Button variant="destructive" size="sm" icon={Ban} onClick={handleRejectOpen}>
              {arabicSource("lifecycle.exit_approval_reject")}
            </Button>
          </>
        )}
        {task.action === "start_settlement" && (
          <Button variant="warning" size="sm" icon={Flag} disabled={busy} onClick={handleStartSettlement}>
            {arabicSource("lifecycle.exit_to_settlement")}
          </Button>
        )}
        {task.action === "confirm_settlement" && (
          <Button variant="info" size="sm" icon={ClipboardCheck} onClick={handleOpen}>
            {arabicSource("lifecycle.task_review_statement")}
          </Button>
        )}
        {task.action === "final_approval" && (
          <Button variant="success" size="sm" icon={CheckCircle2} disabled={busy} onClick={handleComplete}>
            {arabicSource("lifecycle.exit_complete_process")}
          </Button>
        )}
        <Button variant="outline" size="sm" icon={ExternalLink} onClick={handleOpen}>
          {arabicSource("lifecycle.task_open")}
        </Button>
      </div>
      {dialog && (
        <ExitDecisionDialog
          title={dialog === "reject" ? arabicSource("lifecycle.exit_approval_reject_title") : arabicSource("lifecycle.exit_approval_approve_title")}
          confirmLabel={dialog === "reject" ? arabicSource("lifecycle.exit_approval_reject") : arabicSource("lifecycle.exit_approval_approve")}
          icon={dialog === "reject" ? Ban : CheckCircle2}
          commentRequired={dialog === "reject"}
          destructive={dialog === "reject"}
          submitting={submitting}
          onClose={handleDialogClose}
          onSubmit={handleDecision}
        />
      )}
    </div>
  );
};

export default MyTaskActions;
