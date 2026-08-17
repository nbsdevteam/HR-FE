import { arabicSource } from "@/i18n/source";
import type { DbReportTemplate } from "@/shared/hooks";
import type { ReportRow } from "../types";
import ReportResultRow from "./ReportResultRow";

type ReportResultsTableProps = {
  data: ReportRow[];
  template: DbReportTemplate;
  filterDept: string;
  dateFrom: string;
  dateTo: string;
};

const ReportResultsTable = ({ data, template, filterDept, dateFrom, dateTo }: ReportResultsTableProps) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm text-muted-foreground">
        {data.length} {arabicSource("common.record")}
        {filterDept && ` ${arabicSource("reports.section")} ${filterDept}`}
        {dateFrom && ` ${arabicSource("reports.from")} ${dateFrom}`}
        {dateTo && ` ${arabicSource("reports.to")} ${dateTo}`}
      </p>
    </div>
    <div className="overflow-x-auto border border-border/30 rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 border-b border-border/40">
            <th className="p-3 text-start text-muted-foreground font-medium" style={{ fontSize: 12 }}>#</th>
            {template.columns.map(col => (
              <th key={col.key} className="p-3 text-start text-muted-foreground font-medium" style={{ fontSize: 12 }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 200).map((row, idx) => (
            <ReportResultRow key={idx} row={row} index={idx} columns={template.columns} />
          ))}
        </tbody>
      </table>
    </div>
    {data.length > 200 && (
      <p className="text-center text-muted-foreground text-xs mt-3">
        {arabicSource("reports.the_first_200_records_of_a_parent_are_displayed")} {data.length}{arabicSource("reports.export_to_get_full_data")}
      </p>
    )}
  </div>
);

export default ReportResultsTable;
