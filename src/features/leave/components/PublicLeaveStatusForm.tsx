import { motion } from "motion/react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import { PUBLIC_LEAVE_VERIFY_PROMPTS } from "../constants/publicLeaveVerification";
import PublicLeaveEmployeeSearchResultRow from "./PublicLeaveEmployeeSearchResultRow";
import type { usePublicLeaveRequestPage } from "../hooks/usePublicLeaveRequestPage";

type PublicLeaveStatusFormProps = {
  page: ReturnType<typeof usePublicLeaveRequestPage>;
};

/**
 * Track-a-request screen — identifies the employee the same way as the
 * request flow, then asks for the reference code too; the reference alone
 * is not enough, by design (backend hand-off §7).
 */
const PublicLeaveStatusForm = ({ page }: PublicLeaveStatusFormProps) => {
  const { handleBackFromTrack, handleTrackCheckStatus, handleTrackSelectEmployee, info, trackSearch, trackStatus, trackVerification } = page;
  const employee = trackSearch.selected;
  const { primary } = useLocalizedName(employee?.name_ar || "", employee?.name || "");
  const method = info.info?.verification_method || "none";
  const prompt = PUBLIC_LEAVE_VERIFY_PROMPTS[method];

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    trackSearch.updateQuery(event.target.value);
  };

  const handleReferenceChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    trackStatus.setReferenceCode(event.target.value);
  };

  const handleVerificationChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    trackVerification.setValue(event.target.value);
  };

  const handleChangeEmployeeClick = (): void => {
    trackSearch.clearSelection();
  };

  const handleCheckClick = (): void => {
    handleTrackCheckStatus();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h1 className="text-foreground" style={{ fontSize: 20 }}>{arabicSource("public_leave.track_title")}</h1>

      {!employee ? (
        <>
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
            <input
              type="text"
              dir="auto"
              value={trackSearch.query}
              onChange={handleQueryChange}
              placeholder={arabicSource("public_leave.search_placeholder")}
              className="w-full ps-10 pe-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
              style={{ fontSize: 14 }}
            />
          </div>
          {trackSearch.searching && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          )}
          {!trackSearch.searching && trackSearch.results.length > 0 && (
            <div className="space-y-2">
              {trackSearch.results.map((item) => (
                <PublicLeaveEmployeeSearchResultRow
                  key={item.id}
                  employee={item}
                  selected={false}
                  onSelect={handleTrackSelectEmployee}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-border">
            <span className="text-foreground" style={{ fontSize: 13.5 }} data-i18n-ignore>{primary}</span>
            <button
              type="button"
              onClick={handleChangeEmployeeClick}
              className="text-primary hover:underline cursor-pointer"
              style={{ fontSize: 12 }}
            >
              {arabicSource("public_leave.choose_someone_else")}
            </button>
          </div>

          {prompt && (
            <div>
              <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
                {arabicSource(prompt.labelKey)}
              </label>
              <input
                type={prompt.inputType}
                dir="ltr"
                value={trackVerification.value}
                onChange={handleVerificationChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
                style={{ fontSize: 14 }}
              />
            </div>
          )}

          <div>
            <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
              {arabicSource("public_leave.reference_label")}
            </label>
            <input
              type="text"
              dir="ltr"
              value={trackStatus.referenceCode}
              onChange={handleReferenceChange}
              placeholder="LV-2026-00042"
              className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground focus:ring-2 focus:ring-ring outline-none"
              style={{ fontSize: 14 }}
            />
          </div>

          {trackVerification.error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span style={{ fontSize: 12.5 }}>{trackVerification.error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleCheckClick}
            disabled={trackVerification.verifying || !trackStatus.referenceCode.trim()}
            className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
            style={{ fontSize: 14 }}
          >
            {trackVerification.verifying ? arabicSource("public_leave.checking_status") : arabicSource("public_leave.check_status_button")}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleBackFromTrack}
        className="w-full text-center text-muted-foreground hover:underline cursor-pointer"
        style={{ fontSize: 12.5 }}
      >
        {arabicSource("common.previous")}
      </button>
    </motion.div>
  );
};

export default PublicLeaveStatusForm;
