import type { GradeCode } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import type { GradeLadderRow } from "../utils/gradeLadder";
import { maxEmployeeCount } from "../utils/gradeLadder";
import GradeRung from "./GradeRung";

type GradeLadderProps = {
  rows: GradeLadderRow[];
  totalEmployees: number;
  expandedCodes: Set<GradeCode>;
  onToggleRung: (code: GradeCode) => void;
};

/** The seven-rung ladder, most senior at top. A spine runs behind the code chips so it reads as one ladder rather than seven cards — never re-sort `rows` by headcount, vertical position carries seniority. */
const GradeLadder = ({ rows, totalEmployees, expandedCodes, onToggleRung }: GradeLadderProps) => {
  const maxCount = maxEmployeeCount(rows);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-2" style={{ fontSize: 15 }}>{arabicSource("hierarchy.headcount_by_grade")}</h2>
      <div className="relative">
        <div className="absolute start-5 top-3 bottom-3 w-0.5 bg-border" aria-hidden="true" />
        {rows.map((row) => (
          <GradeRung
            key={row.code}
            row={row}
            maxCount={maxCount}
            totalEmployees={totalEmployees}
            isExpanded={expandedCodes.has(row.code)}
            onToggle={onToggleRung}
          />
        ))}
      </div>
    </div>
  );
};

export default GradeLadder;
