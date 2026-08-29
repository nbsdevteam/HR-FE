import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import type { usePublicLeaveRequestPage } from "../hooks/usePublicLeaveRequestPage";

type PublicLeaveReviewProps = {
  page: ReturnType<typeof usePublicLeaveRequestPage>;
};

/**
 * Read-back-before-submit — this is a one-shot no-login form with no "my
 * requests" list to correct a mistake from, so a review step is worth the
 * extra screen (backend hand-off §10).
 */
const PublicLeaveReview = ({ page }: PublicLeaveReviewProps) => {
  const { form, handleBackFromReview, handleSubmit, selectedLeaveType } = page;
  const { primary: leaveTypeName } = useLocalizedName(
    selectedLeaveType?.name_ar || "",
    selectedLeaveType?.name || "",
  );

  const isHourly = form.form.duration_unit === "hour";

  const handleSubmitClick = (): void => {
    void handleSubmit();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-foreground" style={{ fontSize: 20 }}>{arabicSource("public_leave.review_title")}</h1>
        <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
          {arabicSource("public_leave.review_subtitle")}
        </p>
      </div>

      <div className="rounded-xl border border-border divide-y divide-border">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.leave_type_label")}</span>
          <span className="text-foreground" style={{ fontSize: 13 }} data-i18n-ignore>{leaveTypeName}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.date_from_label")}</span>
          <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{form.form.date_from}</span>
        </div>
        {!isHourly && (
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.date_to_label")}</span>
            <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{form.form.date_to || form.form.date_from}</span>
          </div>
        )}
        {isHourly && (
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.hours_label")}</span>
            <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{form.form.hours}</span>
          </div>
        )}
        {!isHourly && form.form.half_day && (
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.half_day_label")}</span>
            <span className="text-foreground" style={{ fontSize: 13 }}>✓</span>
          </div>
        )}
        {form.form.reason && (
          <div className="px-4 py-3">
            <span className="text-muted-foreground block mb-1" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.reason_label")}</span>
            <span className="text-foreground" style={{ fontSize: 13 }} dir="auto">{form.form.reason}</span>
          </div>
        )}
        {form.file && (
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-muted-foreground" style={{ fontSize: 12.5 }}>{arabicSource("public_leave.attachment_label")}</span>
            <span className="text-foreground" style={{ fontSize: 13 }} dir="ltr">{form.file.name}</span>
          </div>
        )}
      </div>

      {form.submitError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span style={{ fontSize: 12.5 }}>{form.submitError}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleBackFromReview}
          disabled={form.submitting}
          className="px-4 py-3 rounded-lg border border-border text-foreground hover:bg-muted/20 transition-colors disabled:opacity-50 cursor-pointer"
          style={{ fontSize: 13 }}
        >
          {arabicSource("common.previous")}
        </button>
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={form.submitting}
          className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          style={{ fontSize: 14 }}
        >
          {form.submitting ? arabicSource("public_leave.submitting") : arabicSource("public_leave.submit_button")}
        </button>
      </div>
    </motion.div>
  );
};

export default PublicLeaveReview;
