import { useTranslation } from "react-i18next";
import type { GradeSummaryTitle } from "@/shared/hooks";

type GradeRungTitleRowProps = {
  title: GradeSummaryTitle;
};

/** One payroll job title feeding a grade. Most titles are budgeted but empty, so the row prints `filled / seats` rather than a bare headcount — a lone "0" hides that the position exists at all. */
const GradeRungTitleRow = ({ title }: GradeRungTitleRowProps) => {
  const { t } = useTranslation();
  // `title_ar` falls back to an empty string, never to the English title.
  const secondaryLabel = title.title_ar && title.title_ar !== title.title ? title.title_ar : "";

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border/30 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate" style={{ fontSize: 13 }}>{title.title}</p>
        {secondaryLabel && (
          <p className="truncate text-muted-foreground" style={{ fontSize: 11 }}>{secondaryLabel}</p>
        )}
        {title.department && (
          <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{title.department}</p>
        )}
      </div>
      <span className="tabular-nums text-muted-foreground shrink-0 text-end" style={{ fontSize: 12 }}>
        {t("hierarchy.filled_of_seats", { filled: title.employee_count, seats: title.seats })}
        {title.vacancies > 0 ? ` · ${t("hierarchy.n_vacant", { count: title.vacancies })}` : ""}
      </span>
    </div>
  );
};

export default GradeRungTitleRow;
