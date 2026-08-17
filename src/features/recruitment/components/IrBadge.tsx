import { Loader2, Sparkles, RefreshCw, ShieldAlert } from "lucide-react";
import { type DbApplicant } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { IR_STATUS_LABELS } from "../constants/recruitment";
import { calcRankScore, hasIr, rankLabel } from "../utils/recruitmentRanking";

const IrBadge = ({ applicant, showStatus = true }: { applicant: DbApplicant; showStatus?: boolean }) => {
  const status = applicant.ir_status || "none";

  if (!hasIr(applicant)) {
    if (showStatus && (status === "pending" || status === "processing")) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/40 bg-muted/10 text-muted-foreground" style={{ fontSize: 11 }}>
          <Loader2 className="w-3 h-3 animate-spin" />{IR_STATUS_LABELS[status]}
        </span>
      );
    }
    const estimate = calcRankScore(applicant);
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/40 bg-muted/10 text-muted-foreground"
        style={{ fontSize: 11 }} title={arabicSource("recruitment.ir_estimated")}>
        {estimate}% — {arabicSource("recruitment.ir_estimated")}
      </span>
    );
  }

  const score = Math.round(applicant.ir_score as number);
  const band = rankLabel(score, applicant.ir_band);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${band.color}`} style={{ fontSize: 11 }}>
      <Sparkles className="w-3 h-3" />{score}% — {band.text}
      {applicant.ir_needs_review && <ShieldAlert className="w-3 h-3 text-amber-400" />}
      {status === "stale" && <RefreshCw className="w-3 h-3 opacity-60" />}
    </span>
  );
};

export default IrBadge;

/** Full IR breakdown: components with evidence, penalties, skills and flags. */
