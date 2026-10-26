import { useCallback, useState } from "react";
import { Ban, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/shared/components";
import { formatDateTime } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { DbExitProcess } from "@/shared/hooks";
import type { ExitDecisionActions } from "../hooks/useExitDecisionActions";
import ExitApprovalStepRow from "./ExitApprovalStepRow";
import ExitDecisionDialog from "./ExitDecisionDialog";

type ExitApprovalPanelProps = {
  proc: DbExitProcess;
  /** The backend lists this process in the user's My tasks as an approval to decide. */
  canDecide: boolean;
  actions: ExitDecisionActions;
  cardCls: string;
};

type DecisionKind = "approve" | "reject";

/**
 * The sign-off timeline: each approver, their decision and when, with the
 * pending step's approvers named. A rejection sends the process back to in
 * progress with its reason, which stays on show until HR resubmits or cancels.
 */
const ExitApprovalPanel = ({ proc, canDecide, actions, cardCls }: ExitApprovalPanelProps) => {
  const [dialog, setDialog] = useState<DecisionKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { approval } = proc;

  const handleApproveOpen = useCallback((): void => setDialog("approve"), []);
  const handleRejectOpen = useCallback((): void => setDialog("reject"), []);
  const handleDialogClose = useCallback((): void => setDialog(null), []);

  const handleSubmit = useCallback(async (comment: string): Promise<void> => {
    setSubmitting(true);
    const decided = dialog === "reject"
      ? await actions.reject(proc.id, comment)
      : await actions.approve(proc.id, comment);
    setSubmitting(false);
    if (decided) setDialog(null);
  }, [actions, dialog, proc.id]);

  if (!approval) return null;
  const sentBack = proc.status === "in_progress" && approval.rejection_reason;
  const deciding = proc.status === "approval" && canDecide;

  return (
    <section className={`${cardCls} p-5 space-y-3`} data-exit-approval={approval.status}>
      <h3 className="flex items-center gap-2 text-foreground">
        <ShieldCheck className="w-5 h-5 text-primary" />
        {arabicSource("lifecycle.exit_approval_title")}
        {approval.workflow_name && <span className="text-muted-foreground" style={{ fontSize: 12 }} dir="auto">({approval.workflow_name})</span>}
      </h3>
      {approval.submitted_by_name && (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("lifecycle.exit_approval_submitted_by")}: <span dir="auto">{approval.submitted_by_name}</span>
          {approval.submitted_at && <> · <span dir="ltr">{formatDateTime(approval.submitted_at, { timeZone: "Asia/Baghdad" })}</span></>}
        </p>
      )}
      {sentBack && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400" style={{ fontSize: 13 }} data-exit-rejection>
          {arabicSource("lifecycle.exit_approval_sent_back")}: <span dir="auto">{approval.rejection_reason}</span>
        </p>
      )}
      <ol>
        {approval.steps.map(step => (
          <ExitApprovalStepRow key={step.sequence} step={step} />
        ))}
      </ol>
      {deciding && (
        <div className="flex gap-2">
          <Button variant="success" size="sm" icon={CheckCircle2} onClick={handleApproveOpen} data-exit-approve>
            {arabicSource("lifecycle.exit_approval_approve")}
          </Button>
          <Button variant="destructive" size="sm" icon={Ban} onClick={handleRejectOpen} data-exit-reject>
            {arabicSource("lifecycle.exit_approval_reject")}
          </Button>
        </div>
      )}
      {dialog && (
        <ExitDecisionDialog
          title={dialog === "reject" ? arabicSource("lifecycle.exit_approval_reject_title") : arabicSource("lifecycle.exit_approval_approve_title")}
          confirmLabel={dialog === "reject" ? arabicSource("lifecycle.exit_approval_reject") : arabicSource("lifecycle.exit_approval_approve")}
          icon={dialog === "reject" ? Ban : CheckCircle2}
          commentRequired={dialog === "reject"}
          destructive={dialog === "reject"}
          submitting={submitting}
          onClose={handleDialogClose}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
};

export default ExitApprovalPanel;
