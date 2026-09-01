import { useTranslation } from "react-i18next";
import type { GradeCode } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { GradeLadderRow } from "../utils/gradeLadder";
import { maxSeats } from "../utils/gradeLadder";
import GradeRung from "./GradeRung";

type GradeLadderProps = {
  rows: GradeLadderRow[];
  expandedCodes: Set<GradeCode>;
  onToggleRung: (code: GradeCode) => void;
};

/** The seven-rung ladder, most senior at top. A spine runs behind the code chips so it reads as one ladder rather than seven cards — never re-sort `rows` by headcount, vertical position carries seniority. Bars scale to the largest *establishment*, not the largest headcount, so an imported structure with few employees still renders as a shape. */
const GradeLadder = ({ rows, expandedCodes, onToggleRung }: GradeLadderProps) => {
  const { t } = useTranslation();
  const maxSeatCount = maxSeats(rows);
  const seatTotal = rows.reduce((sum, row) => sum + row.seats, 0);
  const filledTotal = rows.reduce((sum, row) => sum + row.employee_count, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 style={{ fontSize: 15 }}>{arabicSource("hierarchy.headcount_by_grade")}</h2>
        <span className="tabular-nums text-muted-foreground" style={{ fontSize: 12 }}>
          {t("hierarchy.filled_of_seats", { filled: filledTotal, seats: seatTotal })}
        </span>
      </div>
      <div className="relative">
        <div className="absolute start-5 top-3 bottom-3 w-0.5 bg-border" aria-hidden="true" />
        {rows.map((row) => (
          <GradeRung
            key={row.code}
            row={row}
            maxSeatCount={maxSeatCount}
            isExpanded={expandedCodes.has(row.code)}
            onToggle={onToggleRung}
          />
        ))}
      </div>
    </div>
  );
};

export default GradeLadder;
