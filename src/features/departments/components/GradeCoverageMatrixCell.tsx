import { useTranslation } from "react-i18next";
import type { GradeCode } from "@/shared/hooks";
import type { CoverageMetric } from "../utils/gradeLadder";
import { COVERAGE_BIN_CLASS, coverageBin } from "../utils/gradeLadder";

type GradeCoverageMatrixCellProps = {
  departmentName: string;
  code: GradeCode;
  count: number;
  metric: CoverageMetric;
};

/** One department × grade cell — sequential colour bin (binned per metric, since seat values run far higher than headcounts), the count always printed so colour is never the only channel, zero shown as an en-dash on the neutral surface. */
const GradeCoverageMatrixCell = ({ departmentName, code, count, metric }: GradeCoverageMatrixCellProps) => {
  const { t } = useTranslation();
  const bin = coverageBin(count, metric);
  const metricLabel = t(metric === "seats" ? "hierarchy.seats" : "hierarchy.current_staff");
  const tooltip = `${departmentName} · ${t("hierarchy.grade_code", { code })} · ${metricLabel}: ${count}`;

  return (
    <td className="px-1 py-1 text-center">
      <span
        title={tooltip}
        className={`inline-flex items-center justify-center w-9 h-7 rounded-md tabular-nums ${COVERAGE_BIN_CLASS[bin]}`}
        style={{ fontSize: 12 }}
      >
        {count === 0 ? "–" : count}
      </span>
    </td>
  );
};

export default GradeCoverageMatrixCell;
