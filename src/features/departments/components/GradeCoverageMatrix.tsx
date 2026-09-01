import { useState, useCallback } from "react";
import { arabicSource } from "@/i18n/source";
import type { CoverageMatrix, CoverageMetric } from "../utils/gradeLadder";
import GradeCoverageMatrixHeaderCell from "./GradeCoverageMatrixHeaderCell";
import GradeCoverageMatrixRow from "./GradeCoverageMatrixRow";
import GradeCoverageMatrixTotalCell from "./GradeCoverageMatrixTotalCell";
import GradeMetricToggleButton from "./GradeMetricToggleButton";

type GradeCoverageMatrixProps = {
  matrix: CoverageMatrix;
};

/** Department × grade coverage grid — the department column stays pinned while the grid scrolls horizontally inside its own container, so the page body never scrolls sideways. Reads either budgeted seats (the default: stable, matches the establishment) or current staff, and always includes the department-less remainder row so its totals match the ladder's. */
const GradeCoverageMatrix = ({ matrix }: GradeCoverageMatrixProps) => {
  const [metric, setMetric] = useState<CoverageMetric>("seats");

  const handleSelectMetric = useCallback((next: CoverageMetric): void => {
    setMetric(next);
  }, []);

  const columnTotals = metric === "seats" ? matrix.seatColumnTotals : matrix.columnTotals;
  const grandTotal = metric === "seats" ? matrix.seatGrandTotal : matrix.grandTotal;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 style={{ fontSize: 15 }}>{arabicSource("hierarchy.grade_coverage_by_department")}</h2>
        <div className="inline-flex items-center gap-1 rounded-lg bg-muted/40 p-1">
          <GradeMetricToggleButton
            metric="seats"
            label={arabicSource("hierarchy.seats")}
            isActive={metric === "seats"}
            onSelect={handleSelectMetric}
          />
          <GradeMetricToggleButton
            metric="staff"
            label={arabicSource("hierarchy.current_staff")}
            isActive={metric === "staff"}
            onSelect={handleSelectMetric}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="sticky start-0 z-10 bg-card px-3 py-2 text-start font-medium text-muted-foreground"
                style={{ fontSize: 12 }}
              >
                {arabicSource("common.section")}
              </th>
              {matrix.columnCodes.map((code) => (
                <GradeCoverageMatrixHeaderCell key={code} code={code} />
              ))}
              <th scope="col" className="px-3 py-2 text-center font-medium text-muted-foreground" style={{ fontSize: 12 }}>
                {arabicSource("common.total")}
              </th>
            </tr>
          </thead>
          <tbody>
            {matrix.rows.map((row) => (
              <GradeCoverageMatrixRow key={row.departmentId} row={row} columnCodes={matrix.columnCodes} metric={metric} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <th scope="row" className="sticky start-0 z-10 bg-card px-3 py-2 text-start font-medium" style={{ fontSize: 12 }}>
                {arabicSource("common.total")}
              </th>
              {matrix.columnCodes.map((code) => (
                <GradeCoverageMatrixTotalCell key={code} count={columnTotals[code] ?? 0} />
              ))}
              <td className="px-3 py-2 text-center tabular-nums font-semibold" style={{ fontSize: 12 }}>
                {grandTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default GradeCoverageMatrix;
