import { useState, useCallback } from "react";
import { Check, X } from "lucide-react";
import { ModalHeader, ModalOverlay } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation, type DbLeaveExcuseQueueItem, type LeaveExcuseQueueScope } from "@/shared/hooks";
import { leaveErrorMessage } from "../utils/leaveErrorMessage";
import type { LeaveExcuseDecisionAction } from "../hooks/useLeaveExcuseReview";
import LeaveFormError from "./LeaveFormError";
import LeaveModalActions from "./LeaveModalActions";

type LeaveExcuseDecisionModalProps = {
  item: DbLeaveExcuseQueueItem;
  action: LeaveExcuseDecisionAction;
  scope: LeaveExcuseQueueScope;
  onClose: () => void;
  onDecided: () => Promise<void>;
};

/**
 * Manager/HR decision on one excuse request (backend v1.16.0 §3, §6).
 * `scope: "team"` is the direct manager's own call, so it rides the generic
 * approvals engine via `approval_request_id`. `scope: "hr"` decides directly
 * by leave id and is tagged in the audit log as an HR override — accurate for
 * this screen, since HR reaching a row here is always deciding on someone
 * else's behalf.
 */
const LeaveExcuseDecisionModal = ({ item, action, scope, onClose, onDecided }: LeaveExcuseDecisionModalProps) => {
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const isApprove = action === "approve";

  const decisionMutation = useOdooMutation<unknown, string | undefined>(
    (trimmedComment) => {
      if (scope === "hr") return odooData.overrideLeaveExcuse(item.id, isApprove, trimmedComment);
      if (isApprove) return odooData.approveApprovalRequest(item.approval_request_id, trimmedComment);
      return odooData.rejectApprovalRequest(item.approval_request_id, trimmedComment);
    },
    isApprove ? ["leaveExcuseQueue", "leaveRequests", "leaveBalances"] : ["leaveExcuseQueue", "leaveRequests"],
  );

  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setComment(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    setError("");
    try {
      await decisionMutation.mutateAsync(comment.trim() || undefined);
      await onDecided();
    } catch (e: unknown) {
      setError(leaveErrorMessage(e, arabicSource("leave.error_excuse_decision_failed")));
    }
  }, [comment, decisionMutation, onDecided]);

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg"
    >
      <ModalHeader
        title={isApprove ? arabicSource("leave.excuse_approve_title") : arabicSource("leave.excuse_reject_title")}
        icon={isApprove ? Check : X}
        onClose={onClose}
      />

      <LeaveFormError message={error} />

      <div className="space-y-4">
        <p className="text-muted-foreground" style={{ fontSize: 13 }}>
          {isApprove ? arabicSource("leave.excuse_approve_message") : arabicSource("leave.excuse_reject_message")}
        </p>

        <div>
          <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
            {arabicSource("leave.excuse_decision_comment_label")}
          </label>
          <textarea
            value={comment}
            onChange={handleCommentChange}
            rows={2}
            placeholder={arabicSource("leave.excuse_decision_comment_placeholder")}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
          />
        </div>

        <LeaveModalActions
          submitLabel={isApprove ? arabicSource("common.accept") : arabicSource("common.rejected_2")}
          saving={decisionMutation.isPending}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      </div>
    </ModalOverlay>
  );
};

export default LeaveExcuseDecisionModal;
