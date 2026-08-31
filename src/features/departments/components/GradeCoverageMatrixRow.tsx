import type { GradeCode } from "@/shared/hooks";
import type { CoverageMatrixRow } from "../utils/gradeLadder";
import GradeCoverageMatrixCell from "./GradeCoverageMatrixCell";

type GradeCoverageMatrixRowProps = {
  row: CoverageMatrixRow;
  columnCodes: GradeCode[];
};

/** One department's row in the coverage matrix — extracted from the table body's `.map()`. */
const GradeCoverageMatrixRow = ({ row, columnCodes }: GradeCoverageMatrixRowProps) => (
  <tr className="border-b border-border/30 last:border-b-0">
    <th
      scope="row"
      className="sticky start-0 z-10 bg-card px-3 py-2 text-start font-normal whitespace-nowrap"
      style={{ fontSize: 12 }}
    >
      {row.departmentName}
    </th>
    {columnCodes.map((code) => (
      <GradeCoverageMatrixCell key={code} departmentName={row.departmentName} code={code} count={row.cells[code] ?? 0} />
    ))}
    <td className="px-3 py-2 text-center tabular-nums font-medium" style={{ fontSize: 12 }}>
      {row.total}
    </td>
  </tr>
);

export default GradeCoverageMatrixRow;
