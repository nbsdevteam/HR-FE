import { ShieldCheck } from "lucide-react";
import { formatDateTime } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { DbExitProcess } from "@/shared/hooks";
import ExitApprovalStepRow from "./ExitApprovalStepRow";

type ExitApprovalPanelProps = {
  proc: DbExitProcess;
  cardCls: string;
};

/**
 * The sign-off timeline: each approver, their decision and when, with the
 * pending step's approvers named. A rejection sends the process back to in
 * progress with its reason, which stays on show until HR resubmits or cancels.
 * Approve and Reject are on the Now panel's row for the pending step.
 */
const ExitApprovalPanel = ({ proc, cardCls }: ExitApprovalPanelProps) => {
  const { approval } = proc;

  if (!approval) return null;
  const sentBack = proc.status === "in_progress" && approval.rejection_reason;

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
    </section>
  );
};

export default ExitApprovalPanel;
