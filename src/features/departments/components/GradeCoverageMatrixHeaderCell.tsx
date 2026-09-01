import { useTranslation } from "react-i18next";
import type { GradeCode } from "@/shared/hooks";

type GradeCoverageMatrixHeaderCellProps = {
  code: GradeCode;
};

/** One grade-column header in the coverage matrix — extracted from the header row's `.map()`. */
const GradeCoverageMatrixHeaderCell = ({ code }: GradeCoverageMatrixHeaderCellProps) => {
  const { t } = useTranslation();

  return (
    <th
      scope="col"
      className="px-2 py-2 text-center font-medium text-muted-foreground"
      style={{ fontSize: 12 }}
      title={t("hierarchy.grade_code", { code })}
    >
      {code}
    </th>
  );
};

export default GradeCoverageMatrixHeaderCell;
