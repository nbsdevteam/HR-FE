import { memo } from "react";

type ReportResultsHeaderCellProps = {
  label: string;
};

const ReportResultsHeaderCell = ({ label }: ReportResultsHeaderCellProps) => (
  <th
    className="p-3 text-start text-muted-foreground font-medium"
    style={{ fontSize: 12 }}
  >
    {label}
  </th>
);

export default memo(ReportResultsHeaderCell);
