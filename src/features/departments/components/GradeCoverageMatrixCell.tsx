import { useTranslation } from "react-i18next";
import type { GradeCode } from "@/shared/hooks";
import { COVERAGE_BIN_CLASS, coverageBin } from "../utils/gradeLadder";

type GradeCoverageMatrixCellProps = {
  departmentName: string;
  code: GradeCode;
  count: number;
};

/** One department × grade cell — sequential colour bin, the count always printed so colour is never the only channel, zero shown as an en-dash on the neutral surface. */
const GradeCoverageMatrixCell = ({ departmentName, code, count }: GradeCoverageMatrixCellProps) => {
  const { t } = useTranslation();
  const bin = coverageBin(count);
  const tooltip = `${departmentName} · ${t("hierarchy.grade_code", { code })} · ${count}`;

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
