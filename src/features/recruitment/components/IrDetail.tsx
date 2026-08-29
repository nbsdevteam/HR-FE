import { useState, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, TrendingUp } from "lucide-react";
import StatusBadge from "@/shared/components/StatusBadge";
import { type DbApplicant } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { normalizeLanguage } from "@/i18n";
import { MISSING_INFO_LABELS } from "../constants/recruitment";
import { rankLabel } from "../utils/recruitmentRanking";
import IrComponentRow from "./IrComponentRow";
import IrPenaltyRow from "./IrPenaltyRow";
import Chip from "./Chip";
import RedFlagRow from "./RedFlagRow";
import MissingInfoTag from "./MissingInfoTag";

const IrDetail = ({ applicant }: { applicant: DbApplicant }) => {
  const [openEvidence, setOpenEvidence] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const breakdown = applicant.ir_breakdown || {};
  const components = breakdown.components || {};
  const penalties = breakdown.penalties || [];
  const score = Math.round(applicant.ir_score || 0);
  const band = rankLabel(score, applicant.ir_band);
  // The model writes the summary twice, once per language, so an English
  // reader gets English prose instead of Arabic run through the DOM
  // localizer. Sorani has no summary of its own; Arabic is the closer
  // fallback for this audience.
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const summary = language === "en"
    ? applicant.ir_summary_en || applicant.ir_summary_ar
    : applicant.ir_summary_ar || applicant.ir_summary_en;
  const summaryDir = summary && summary === applicant.ir_summary_en ? "ltr" : "rtl";

  const toggleEvidence = useCallback(
    (key: string) => setOpenEvidence(current => (current === key ? null : key)),
    [],
  );

  return (
    <div className="space-y-4">
      {/* Headline score */}
      <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-muted/10 p-4">
        <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center flex-shrink-0 ${band.color}`}>
          <span style={{ fontSize: 22 }}>{score}</span>
          <span style={{ fontSize: 9 }}>/ 100</span>
        </div>
        <div className="min-w-0">
          <StatusBadge colorClassName={band.color}>{band.text}</StatusBadge>
          <p className="text-muted-foreground mt-1.5" style={{ fontSize: 11 }}>
            {arabicSource("recruitment.ai_disclaimer")}
          </p>
          {Boolean(applicant.ir_confidence) && (
            <p className="text-muted-foreground mt-1" style={{ fontSize: 11 }}>
              {arabicSource("recruitment.confidence")}: {Math.round((applicant.ir_confidence || 0) * 100)}%
            </p>
          )}
        </div>
      </div>

      {applicant.ir_needs_review && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-400" style={{ fontSize: 12 }}>
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          {arabicSource("recruitment.needs_review")}
        </div>
      )}

      {/* AI summary. `data-i18n-ignore` keeps the DOM localizer off model
          prose: with no catalogue entry for a whole free-text paragraph it
          falls back to replacing catalogued phrases substring by substring,
          which shreds the sentences into an Arabic/English mash. */}
      {summary && (
        <div>
          <label className="text-muted-foreground block mb-1" style={{ fontSize: 12 }}>
            {arabicSource("recruitment.ai_summary")}
          </label>
          <p
            className="text-foreground rounded-lg border border-border/30 bg-muted/10 p-3"
            style={{ fontSize: 12.5 }}
            dir={summaryDir}
            data-i18n-ignore
          >
            {summary}
          </p>
        </div>
      )}

      {/* Weighted components — click to reveal the evidence behind a score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(components).map(([key, component]) => (
          <IrComponentRow
            key={key}
            componentKey={key}
            component={component}
            isOpen={openEvidence === key}
            onToggle={toggleEvidence}
          />
        ))}
      </div>

      {/* Penalties */}
      {penalties.length > 0 && (
        <div>
          <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
            {arabicSource("recruitment.penalties")}
          </label>
          <div className="space-y-1">
            {penalties.map((penalty, i) => (
              <IrPenaltyRow key={i} detail={penalty.detail} amount={penalty.amount} />
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {(applicant.matched_skills?.length || applicant.missing_skills?.length) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Boolean(applicant.matched_skills?.length) && (
            <div>
              <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
                {arabicSource("recruitment.matched_skills")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {applicant.matched_skills!.map((skill, i) => (
                  <Chip key={`${skill}-${i}`} label={skill} variant="matchedTag" />
                ))}
              </div>
            </div>
          )}
          {Boolean(applicant.missing_skills?.length) && (
            <div>
              <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
                {arabicSource("recruitment.missing_skills")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {applicant.missing_skills!.map((skill, i) => (
                  <Chip key={`${skill}-${i}`} label={skill} variant="missingTag" />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Red flags */}
      {Boolean(applicant.ir_red_flags?.length) && (
        <div>
          <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
            {arabicSource("recruitment.red_flags")}
          </label>
          <div className="space-y-1">
            {applicant.ir_red_flags!.map((flag, i) => (
              <RedFlagRow key={i} detail={flag.detail} />
            ))}
          </div>
        </div>
      )}

      {/* Missing information */}
      {Boolean(applicant.ir_missing_info?.length) && (
        <div>
          <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
            {arabicSource("recruitment.missing_info")}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {applicant.ir_missing_info!.map((info) => (
              <MissingInfoTag key={info} info={info} label={MISSING_INFO_LABELS[info]} />
            ))}
          </div>
        </div>
      )}

      {/* Better-fit suggestion across the other open positions. The score is
          shown because it is not the IR above it — it is keyword overlap, and
          HR needs to see how thin the evidence behind the hint is. */}
      {applicant.suggested_job_title && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-primary" style={{ fontSize: 12 }}>
          <TrendingUp className="w-4 h-4 flex-shrink-0" />
          {arabicSource("recruitment.suggested_job")}:{" "}
          <span data-i18n-ignore>{applicant.suggested_job_title}</span>
          {Boolean(applicant.suggested_job_score) && (
            <span className="opacity-70" dir="ltr">({Math.round(applicant.suggested_job_score!)}%)</span>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(IrDetail);
