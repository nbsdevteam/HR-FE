import { useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { arabicSource } from "@/i18n/source";
import type { GradeCode } from "@/shared/hooks";
import type { GradeLadderRow } from "../utils/gradeLadder";
import { BAND_BG_CLASS, barWidthPercent } from "../utils/gradeLadder";
import GradeRungTitleRow from "./GradeRungTitleRow";

type GradeRungProps = {
  row: GradeLadderRow;
  maxCount: number;
  totalEmployees: number;
  isExpanded: boolean;
  onToggle: (code: GradeCode) => void;
};

/** One rung of the ladder: code chip, name, headcount bar (or the dashed "unfilled" state), expand/collapse toggle and title table. */
const GradeRung = ({ row, maxCount, totalEmployees, isExpanded, onToggle }: GradeRungProps) => {
  const { t } = useTranslation();
  const isUnfilled = row.employee_count === 0;
  const bandClass = BAND_BG_CLASS[row.band];
  const widthPercent = barWidthPercent(row.employee_count, maxCount);

  const handleToggle = useCallback((): void => {
    onToggle(row.code);
  }, [onToggle, row.code]);

  return (
    <div className="relative ps-16">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        title={t("hierarchy.grade_code", { code: row.code })}
        className="w-full flex items-start gap-4 py-3 text-start cursor-pointer rounded-lg hover:bg-muted/20 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
      >
        <span
          className={`absolute start-0 top-3 w-10 h-10 rounded-full flex items-center justify-center font-semibold ring-4 ring-background shrink-0 ${
            isUnfilled ? "border-2 border-dashed border-flag bg-flag-bg text-flag" : `${bandClass} text-white`
          }`}
          style={{ fontSize: 13 }}
        >
          {row.code}
        </span>

        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span className="font-medium" style={{ fontSize: 14 }}>{row.name}</span>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform motion-reduce:transition-none ${isExpanded ? "rotate-180" : ""}`}
            />
          </span>

          {isUnfilled ? (
            <span
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-dashed border-flag-hair bg-flag-bg px-3 py-1 text-flag"
              style={{ fontSize: 12 }}
            >
              {arabicSource("hierarchy.unfilled")}
            </span>
          ) : (
            <span className="mt-2 flex items-center gap-3">
              <span className="h-2 flex-1 rounded-full bg-muted/40 overflow-hidden">
                <span className={`block h-full rounded-e-md ${bandClass}`} style={{ width: `${widthPercent}%` }} />
              </span>
              <span className="tabular-nums text-muted-foreground shrink-0" style={{ fontSize: 12 }}>
                {row.employee_count} {t("hierarchy.of_total", { total: totalEmployees })}
              </span>
            </span>
          )}
        </span>
      </button>

      {isExpanded && (
        <div className="ms-16 mb-4 rounded-lg border border-border/40 bg-card/50 p-3">
          {isUnfilled ? (
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>
              {row.description || arabicSource("hierarchy.nobody_at_this_grade")}
            </p>
          ) : (
            <>
              <p className="text-muted-foreground mb-2" style={{ fontSize: 11 }}>
                {arabicSource("hierarchy.job_titles_on_this_grade")}
              </p>
              {row.titles.map((title) => (
                <GradeRungTitleRow key={title.designation_id} title={title} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GradeRung;
