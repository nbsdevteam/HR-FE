import { useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { ModalHeader, ModalOverlay } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbLeaveRequest } from "@/shared/hooks";
import { leaveErrorMessage } from "../utils/leaveErrorMessage";
import LeaveFormError from "./LeaveFormError";
import LeaveModalActions from "./LeaveModalActions";

type LeaveExcuseFollowUpModalProps = {
  leave: DbLeaveRequest;
  onClose: () => void;
  onSubmit: (leaveId: string, note: string) => Promise<void>;
};

/**
 * Employee follow-up on a still-pending excuse request (backend v1.16.0
 * §5) — the backend enforces the max-2 / once-a-day limit; `followup_remaining`
 * only disables the triggering button as a UX nicety.
 */
const LeaveExcuseFollowUpModal = ({ leave, onClose, onSubmit }: LeaveExcuseFollowUpModalProps) => {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setNote(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (): Promise<void> => {
    setSaving(true);
    setError("");
    try {
      await onSubmit(leave.id, note.trim());
    } catch (e: unknown) {
      setError(leaveErrorMessage(e, arabicSource("leave.error_excuse_followup_failed")));
      setSaving(false);
    }
  }, [leave.id, note, onSubmit]);

  return (
    <ModalOverlay
      onClose={onClose}
      contentClassName="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg"
    >
      <ModalHeader title={arabicSource("leave.excuse_follow_up")} icon={MessageCircle} onClose={onClose} />

      <LeaveFormError message={error} />

      <div className="space-y-4">
        <p className="text-muted-foreground" style={{ fontSize: 12 }} dir="ltr">
          {leave.excuse.followup_count}/{leave.excuse.followup_max}
        </p>

        <div>
          <label className="text-foreground block mb-1.5" style={{ fontSize: 13 }}>
            {arabicSource("leave.excuse_followup_note_label")}
          </label>
          <textarea
            value={note}
            onChange={handleNoteChange}
            rows={2}
            placeholder={arabicSource("leave.excuse_followup_note_placeholder")}
            className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
          />
        </div>

        <LeaveModalActions
          submitLabel={arabicSource("leave.excuse_follow_up")}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={onClose}
        />
      </div>
    </ModalOverlay>
  );
};

export default LeaveExcuseFollowUpModal;
