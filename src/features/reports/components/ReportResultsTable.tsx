import { memo, useMemo } from "react";
import { arabicSource } from "@/i18n/source";
import DataTable from "@/shared/components/DataTable";
import type { ReportColumn, ReportRow } from "../types";
import { buildReportRowKeys } from "../utils/reportRowKeys";
import ReportResultRow from "./ReportResultRow";
import ReportResultsHeaderCell from "./ReportResultsHeaderCell";

const MAX_VISIBLE_ROWS = 200;

interface IReportResultsTableProps {
  data: ReportRow[];
  columns: ReportColumn[];
  filterDept: string;
  dateFrom: string;
  dateTo: string;
}

const ReportResultsTable = ({
  data,
  columns,
  filterDept,
  dateFrom,
  dateTo,
}: IReportResultsTableProps) => {
  const visibleRows = useMemo(() => data.slice(0, MAX_VISIBLE_ROWS), [data]);
  const rowKeys = useMemo(
    () => buildReportRowKeys(visibleRows, columns),
    [visibleRows, columns],
  );

  const renderRow = (row: ReportRow, index: number) => (
    <ReportResultRow
      key={rowKeys[index]}
      row={row}
      index={index}
      columns={columns}
    />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {data.length} {arabicSource("common.record")}
          {filterDept && ` ${arabicSource("reports.section")} ${filterDept}`}
          {dateFrom && ` ${arabicSource("reports.from")} ${dateFrom}`}
          {dateTo && ` ${arabicSource("reports.to")} ${dateTo}`}
        </p>
      </div>
      <DataTable
        wrapperClassName="overflow-x-auto border border-border/30 rounded-xl"
        scrollClassName=""
        tableClassName="w-full text-sm"
        items={visibleRows}
        header={
          <tr className="bg-muted/30 border-b border-border/40">
            <ReportResultsHeaderCell label="#" />
            {columns.map((col) => (
              <ReportResultsHeaderCell key={col.key} label={col.label} />
            ))}
          </tr>
        }
        renderRow={renderRow}
      />
      {data.length > MAX_VISIBLE_ROWS && (
        <p className="text-center text-muted-foreground text-xs mt-3">
          {arabicSource(
            "reports.the_first_200_records_of_a_parent_are_displayed",
          )}{" "}
          {data.length}
          {arabicSource("reports.export_to_get_full_data")}
        </p>
      )}
    </div>
  );
};

export default memo(ReportResultsTable);
