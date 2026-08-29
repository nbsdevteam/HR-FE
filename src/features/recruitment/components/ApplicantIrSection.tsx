import { useState, useCallback, memo } from "react";
import { AlertCircle, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/shared/components";
import { type DbApplicant } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { IR_STATUS_LABELS } from "../constants/recruitment";
import { hasIr } from "../utils/recruitmentRanking";
import ApplicantIrFallbackBreakdown from "./ApplicantIrFallbackBreakdown";
import IrDetail from "./IrDetail";

type ApplicantIrSectionProps = {
  applicant: DbApplicant;
  onScreen: (a: DbApplicant) => Promise<void>;
};

const ApplicantIrSection = ({ applicant, onScreen }: ApplicantIrSectionProps) => {
  const [screening, setScreening] = useState(false);

  const handleScreen = useCallback(async () => {
    setScreening(true);
    await onScreen(applicant);
    setScreening(false);
  }, [applicant, onScreen]);

  const applicantHasIr = hasIr(applicant);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <label className="text-muted-foreground flex items-center gap-1.5" style={{ fontSize: 12 }}>
          {applicantHasIr && <Sparkles className="w-3.5 h-3.5 text-primary" />}
          {applicantHasIr ? arabicSource("recruitment.ir_score") : arabicSource("recruitment.arrangement_details")}
        </label>
        <Button
          onClick={handleScreen}
          disabled={screening}
          loading={screening}
          icon={RefreshCw}
          iconClassName="w-3.5 h-3.5"
          variant="unstyled"
          size="unstyled"
          rounded="rounded-lg"
          className="gap-1.5 px-3 py-1.5 border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"
          style={{ fontSize: 11 }}
        >
          {applicantHasIr ? arabicSource("recruitment.rescreen") : arabicSource("recruitment.screen_now")}
        </Button>
      </div>

      {applicantHasIr ? (
        <IrDetail applicant={applicant} />
      ) : (
        <>
          {applicant.ir_status && applicant.ir_status !== "none" && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/40 bg-muted/10 px-3 py-2 text-muted-foreground" style={{ fontSize: 12 }}>
              {applicant.ir_status === "pending" || applicant.ir_status === "processing"
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                : <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
              <span>{IR_STATUS_LABELS[applicant.ir_status] || applicant.ir_status}</span>
              {applicant.ir_error && <span className="opacity-70" dir="ltr">{applicant.ir_error}</span>}
            </div>
          )}
          <div className="text-muted-foreground mb-2" style={{ fontSize: 11 }}>
            {arabicSource("recruitment.ir_estimated")}
          </div>
          <ApplicantIrFallbackBreakdown applicant={applicant} />
        </>
      )}
    </div>
  );
};

export default memo(ApplicantIrSection);
