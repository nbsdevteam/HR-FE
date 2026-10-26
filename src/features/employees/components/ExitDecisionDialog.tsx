import { useCallback, useState } from "react";
import type { ComponentType } from "react";
import { Modal, ModalFooterActions } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { lifecycleInputClass } from "../styles/lifecycle";

type ExitDecisionDialogProps = {
  title: string;
  confirmLabel: string;
  icon: ComponentType<{ className?: string }>;
  /** A rejection always needs its written reason; an approval's comment is optional. */
  commentRequired: boolean;
  destructive?: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
};

/** One comment box in front of an approve or reject decision on an End of Service. */
const ExitDecisionDialog = ({
  title, confirmLabel, icon, commentRequired, destructive = false, submitting, onClose, onSubmit,
}: ExitDecisionDialogProps) => {
  const [comment, setComment] = useState("");

  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setComment(e.target.value);
  }, []);
  const handleConfirm = useCallback((): void => {
    onSubmit(comment.trim());
  }, [comment, onSubmit]);

  return (
    <Modal
      onClose={onClose}
      icon={icon}
      title={title}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel={confirmLabel}
          confirmClassName={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
          disabled={commentRequired && !comment.trim()}
          loading={submitting}
        />
      }
    >
      <label className="block">
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          {commentRequired ? arabicSource("lifecycle.exit_clr_reject_reason") : arabicSource("lifecycle.exit_decision_comment_optional")}
        </span>
        <textarea
          dir="auto"
          value={comment}
          onChange={handleCommentChange}
          className={`${lifecycleInputClass} h-24 py-2 mt-1`}
          data-exit-decision-comment
        />
      </label>
    </Modal>
  );
};

export default ExitDecisionDialog;
