import { memo, useCallback } from "react";
import { arabicSource } from "@/i18n/source";

type ApplicantInterviewNotesSectionProps = {
  interviewNotes: string;
  saving: boolean;
  onNotesChange: (value: string) => void;
  onSave: () => void;
};

const ApplicantInterviewNotesSection = ({
  interviewNotes,
  saving,
  onNotesChange,
  onSave,
}: ApplicantInterviewNotesSectionProps) => {
  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
      onNotesChange(e.target.value);
    },
    [onNotesChange],
  );

  return (
    <div>
      <label
        className="text-muted-foreground block mb-1"
        style={{ fontSize: 12 }}
      >
        {arabicSource("recruitment.interview_notes")}
      </label>
      <textarea
        value={interviewNotes}
        onChange={handleNotesChange}
        rows={4}
        placeholder={arabicSource("recruitment.add_interview_notes_here")}
        className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
        style={{ fontSize: 13 }}
      />
      <button
        onClick={onSave}
        disabled={saving}
        className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-gold-dark transition-colors cursor-pointer disabled:opacity-50"
        style={{ fontSize: 12 }}
      >
        {saving
          ? arabicSource("common.saving")
          : arabicSource("recruitment.save_notes")}
      </button>
    </div>
  );
};

export default memo(ApplicantInterviewNotesSection);
