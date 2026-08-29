import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import PublicLeaveAttachmentField from "./PublicLeaveAttachmentField";
import PublicLeaveDurationFields from "./PublicLeaveDurationFields";
import PublicLeaveTypePicker from "./PublicLeaveTypePicker";
import type { usePublicLeaveRequestPage } from "../hooks/usePublicLeaveRequestPage";

type PublicLeaveRequestFormProps = {
  page: ReturnType<typeof usePublicLeaveRequestPage>;
};

/**
 * Honeypot styling deliberately avoids `display:none` — some bots skip
 * hidden fields, but not off-screen-positioned ones (backend hand-off §6).
 */
const HONEYPOT_STYLE: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  opacity: 0,
  pointerEvents: "none",
};

const PublicLeaveRequestForm = ({ page }: PublicLeaveRequestFormProps) => {
  const { canSubmit, form, formValidationError, handleGoToReview, info, selectedLeaveType } = page;

  const handleLeaveTypeSelect = (leaveTypeId: number): void => {
    form.updateForm({ leave_type_id: leaveTypeId });
  };

  const handleReasonChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    form.updateForm({ reason: event.target.value });
  };

  const handleHpChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    form.updateForm({ hp: event.target.value });
  };

  const handleContinueClick = (): void => {
    handleGoToReview();
  };

  const attachmentEnabled = Boolean(info.info?.attachment.enabled);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-foreground" style={{ fontSize: 20 }}>{arabicSource("public_leave.form_title")}</h1>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
          {arabicSource("public_leave.form_subtitle")}
        </p>
      </div>

      <div>
        <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
          {arabicSource("public_leave.leave_type_label")}
        </label>
        <PublicLeaveTypePicker
          leaveTypes={info.info?.leave_types || []}
          selectedId={form.form.leave_type_id}
          onSelect={handleLeaveTypeSelect}
        />
      </div>

      <PublicLeaveDurationFields page={page} />

      <div>
        <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
          {arabicSource("public_leave.reason_label")}
        </label>
        <textarea
          value={form.form.reason}
          onChange={handleReasonChange}
          rows={3}
          dir="auto"
          className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none resize-none"
          style={{ fontSize: 14 }}
        />
      </div>

      {attachmentEnabled && selectedLeaveType && (
        <PublicLeaveAttachmentField
          acceptedFormats={info.info?.attachment.accepted_formats || []}
          file={form.file}
          maxMb={info.info?.attachment.max_mb || 10}
          required={selectedLeaveType.requires_attachment}
          onAcceptFile={form.acceptFile}
        />
      )}

      {form.fileError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontSize: 12.5 }}>{form.fileError}</span>
        </div>
      )}

      <input
        type="text"
        value={form.form.hp}
        onChange={handleHpChange}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={HONEYPOT_STYLE}
      />

      {formValidationError && (
        <p className="text-muted-foreground" style={{ fontSize: 12 }}>{formValidationError}</p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleContinueClick}
        className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        style={{ fontSize: 14 }}
      >
        {arabicSource("public_leave.review_button")}
      </button>
    </motion.div>
  );
};

export default PublicLeaveRequestForm;
