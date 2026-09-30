import { useCallback, useState } from "react";
import { Ban } from "lucide-react";
import { Modal, ModalFooterActions } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { lifecycleInputClass } from "../styles/lifecycle";

type ExitRejectDialogProps = {
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
};

/** A rejection — of a section or of a signature — always carries a written reason. */
const ExitRejectDialog = ({ submitting, onClose, onSubmit }: ExitRejectDialogProps) => {
  const [reason, setReason] = useState("");

  const handleReasonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setReason(e.target.value);
  }, []);
  const handleConfirm = useCallback((): void => {
    onSubmit(reason.trim());
  }, [onSubmit, reason]);

  return (
    <Modal
      onClose={onClose}
      icon={Ban}
      title={arabicSource("lifecycle.exit_clr_reject_title")}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel={arabicSource("lifecycle.exit_clr_reject_confirm")}
          confirmClassName="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          disabled={!reason.trim()}
          loading={submitting}
        />
      }
    >
      <label className="block">
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("lifecycle.exit_clr_reject_reason")}
        </span>
        <textarea
          dir="auto"
          value={reason}
          onChange={handleReasonChange}
          className={`${lifecycleInputClass} h-24 py-2 mt-1`}
          data-exit-reject-reason
        />
      </label>
    </Modal>
  );
};

export default ExitRejectDialog;
