type GradeCoverageMatrixTotalCellProps = {
  count: number;
};

/** One grade-column total in the matrix's totals row — extracted from its `.map()`. */
const GradeCoverageMatrixTotalCell = ({ count }: GradeCoverageMatrixTotalCellProps) => (
  <td className="px-2 py-2 text-center tabular-nums font-medium" style={{ fontSize: 12 }}>
    {count}
  </td>
);

export default GradeCoverageMatrixTotalCell;
