import { arabicSource } from "@/i18n/source";
import type { CoverageMatrix } from "../utils/gradeLadder";
import GradeCoverageMatrixHeaderCell from "./GradeCoverageMatrixHeaderCell";
import GradeCoverageMatrixRow from "./GradeCoverageMatrixRow";
import GradeCoverageMatrixTotalCell from "./GradeCoverageMatrixTotalCell";

type GradeCoverageMatrixProps = {
  matrix: CoverageMatrix;
};

/** Department × grade coverage grid — the department column stays pinned while the grid scrolls horizontally inside its own container, so the page body never scrolls sideways. */
const GradeCoverageMatrix = ({ matrix }: GradeCoverageMatrixProps) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <h2 className="mb-3" style={{ fontSize: 15 }}>{arabicSource("hierarchy.grade_coverage_by_department")}</h2>
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
            <GradeCoverageMatrixRow key={row.departmentId} row={row} columnCodes={matrix.columnCodes} />
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border">
            <th scope="row" className="sticky start-0 z-10 bg-card px-3 py-2 text-start font-medium" style={{ fontSize: 12 }}>
              {arabicSource("common.total")}
            </th>
            {matrix.columnCodes.map((code) => (
              <GradeCoverageMatrixTotalCell key={code} count={matrix.columnTotals[code] ?? 0} />
            ))}
            <td className="px-3 py-2 text-center tabular-nums font-semibold" style={{ fontSize: 12 }}>
              {matrix.grandTotal}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
);

export default GradeCoverageMatrix;
