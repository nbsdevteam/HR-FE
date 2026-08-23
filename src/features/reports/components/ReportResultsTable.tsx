import { arabicSource } from "@/i18n/source";
import DataTable from "@/shared/components/DataTable";
import type { DbReportTemplate } from "@/shared/hooks";
import type { ReportRow } from "../types";
import ReportResultRow from "./ReportResultRow";
import ReportResultsHeaderCell from "./ReportResultsHeaderCell";

interface IReportResultsTableProps {
  data: ReportRow[];
  template: DbReportTemplate;
  filterDept: string;
  dateFrom: string;
  dateTo: string;
}

const ReportResultsTable = ({
  data,
  template,
  filterDept,
  dateFrom,
  dateTo,
}: IReportResultsTableProps) => (
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
      items={data.slice(0, 200)}
      header={
        <tr className="bg-muted/30 border-b border-border/40">
          <ReportResultsHeaderCell label="#" />
          {template.columns.map((col) => (
            <ReportResultsHeaderCell key={col.key} label={col.label} />
          ))}
        </tr>
      }
      renderRow={(row, idx) => (
        <ReportResultRow
          key={idx}
          row={row}
          index={idx}
          columns={template.columns}
        />
      )}
    />
    {data.length > 200 && (
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

export default ReportResultsTable;
