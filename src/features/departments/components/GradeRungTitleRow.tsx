import type { GradeSummaryTitle } from "@/shared/hooks";

type GradeRungTitleRowProps = {
  title: GradeSummaryTitle;
};

/** One real payroll job title feeding a grade — extracted from `GradeRung`'s title `.map()`. */
const GradeRungTitleRow = ({ title }: GradeRungTitleRowProps) => (
  <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border/30 last:border-b-0">
    <div className="min-w-0">
      <p className="truncate" style={{ fontSize: 13 }}>{title.title}</p>
      {title.department && (
        <p className="text-muted-foreground truncate" style={{ fontSize: 11 }}>{title.department}</p>
      )}
    </div>
    <span className="tabular-nums text-muted-foreground shrink-0" style={{ fontSize: 12 }}>
      {title.employee_count}
    </span>
  </div>
);

export default GradeRungTitleRow;
