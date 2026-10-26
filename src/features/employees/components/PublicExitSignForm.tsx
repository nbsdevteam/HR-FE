import { useCallback } from "react";
import { Ban, PenLine } from "lucide-react";
import { Button } from "@/shared/components";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import { lifecycleInputClass } from "../styles/lifecycle";
import ExitSignPad from "./ExitSignPad";

type PublicExitSignFormProps = {
  typedName: string;
  notes: string;
  submitting: boolean;
  errorKey: ArabicSourceKey | null;
  onTypedNameChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSignatureChange: (dataUrl: string | null) => void;
  onSign: () => void;
  onDecline: () => void;
};

/** Sign with the typed full name and a drawn signature, or decline with an optional reason. */
const PublicExitSignForm = ({
  typedName, notes, submitting, errorKey, onTypedNameChange, onNotesChange, onSignatureChange, onSign, onDecline,
}: PublicExitSignFormProps) => {
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    onTypedNameChange(e.target.value);
  }, [onTypedNameChange]);
  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    onNotesChange(e.target.value);
  }, [onNotesChange]);

  return (
    <div className="space-y-4 border-t border-border/40 pt-5">
      <label className="block">
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("public_exit_sign.typed_name_label")}</span>
        <input
          type="text"
          dir="auto"
          value={typedName}
          onChange={handleNameChange}
          disabled={submitting}
          className={`${lifecycleInputClass} mt-1`}
          data-public-exit-name
        />
      </label>
      <div>
        <span className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>{arabicSource("public_exit_sign.signature_label")}</span>
        <ExitSignPad disabled={submitting} onChange={onSignatureChange} />
      </div>
      <label className="block">
        <span className="text-muted-foreground" style={{ fontSize: 12 }}>{arabicSource("public_exit_sign.notes_label")}</span>
        <textarea
          dir="auto"
          value={notes}
          onChange={handleNotesChange}
          disabled={submitting}
          className={`${lifecycleInputClass} h-20 py-2 mt-1`}
        />
      </label>
      {errorKey && <p className="text-destructive" style={{ fontSize: 13 }} data-public-exit-error>{arabicSource(errorKey)}</p>}
      <div className="flex flex-wrap gap-2">
        <Button variant="success" icon={PenLine} loading={submitting} onClick={onSign} data-public-exit-sign>
          {arabicSource("public_exit_sign.sign_button")}
        </Button>
        <Button variant="outline" icon={Ban} disabled={submitting} onClick={onDecline} data-public-exit-decline>
          {arabicSource("public_exit_sign.decline_button")}
        </Button>
      </div>
    </div>
  );
};

export default PublicExitSignForm;
