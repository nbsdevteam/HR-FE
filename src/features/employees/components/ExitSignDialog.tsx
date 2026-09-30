import { useCallback, useState } from "react";
import { PenLine } from "lucide-react";
import { Modal, ModalFooterActions } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { lifecycleInputClass } from "../styles/lifecycle";

type ExitSignDialogProps = {
  submitting: boolean;
  onClose: () => void;
  onSubmit: (typedName: string, notes: string) => void;
};

/** Typed-name capture for a signer who is signed in — the typed name is the signature. */
const ExitSignDialog = ({ submitting, onClose, onSubmit }: ExitSignDialogProps) => {
  const [typedName, setTypedName] = useState("");
  const [notes, setNotes] = useState("");

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setTypedName(e.target.value);
  }, []);
  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setNotes(e.target.value);
  }, []);
  const handleConfirm = useCallback((): void => {
    onSubmit(typedName.trim(), notes.trim());
  }, [onSubmit, typedName, notes]);

  return (
    <Modal
      onClose={onClose}
      icon={PenLine}
      title={arabicSource("lifecycle.exit_clr_sign_title")}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel={arabicSource("lifecycle.exit_clr_sign_confirm")}
          disabled={!typedName.trim()}
          loading={submitting}
        />
      }
    >
      <label className="block">
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("lifecycle.exit_clr_sign_typed_name")}
        </span>
        <input
          type="text"
          dir="auto"
          value={typedName}
          onChange={handleNameChange}
          className={`${lifecycleInputClass} mt-1`}
          data-exit-sign-name
        />
      </label>
      <label className="block">
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>
          {arabicSource("lifecycle.exit_clr_sign_notes")}
        </span>
        <textarea
          dir="auto"
          value={notes}
          onChange={handleNotesChange}
          className={`${lifecycleInputClass} h-20 py-2 mt-1`}
        />
      </label>
    </Modal>
  );
};

export default ExitSignDialog;
