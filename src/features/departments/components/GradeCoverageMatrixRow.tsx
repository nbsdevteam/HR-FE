import type { GradeCode } from "@/shared/hooks";
import type { CoverageMatrixRow, CoverageMetric } from "../utils/gradeLadder";
import { NO_DEPARTMENT_ID } from "../utils/gradeLadder";
import GradeCoverageMatrixCell from "./GradeCoverageMatrixCell";

type GradeCoverageMatrixRowProps = {
  row: CoverageMatrixRow;
  columnCodes: GradeCode[];
  metric: CoverageMetric;
};

/** One department's row in the coverage matrix — extracted from the table body's `.map()`. The department-less remainder row is muted and italic so it never reads as a real department. */
const GradeCoverageMatrixRow = ({ row, columnCodes, metric }: GradeCoverageMatrixRowProps) => {
  const isRemainder = row.departmentId === NO_DEPARTMENT_ID;
  const cells = metric === "seats" ? row.seatCells : row.cells;
  const total = metric === "seats" ? row.seatTotal : row.total;

  return (
    <tr className="border-b border-border/30 last:border-b-0">
      <th
        scope="row"
        className={`sticky start-0 z-10 bg-card px-3 py-2 text-start font-normal whitespace-nowrap ${
          isRemainder ? "italic text-muted-foreground" : ""
        }`}
        style={{ fontSize: 12 }}
      >
        {row.departmentName}
      </th>
      {columnCodes.map((code) => (
        <GradeCoverageMatrixCell
          key={code}
          departmentName={row.departmentName}
          code={code}
          count={cells[code] ?? 0}
          metric={metric}
        />
      ))}
      <td className="px-3 py-2 text-center tabular-nums font-medium" style={{ fontSize: 12 }}>
        {total}
      </td>
    </tr>
  );
};

export default GradeCoverageMatrixRow;
