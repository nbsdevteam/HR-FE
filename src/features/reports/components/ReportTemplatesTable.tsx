import {
  SortableHeaderRow,
  toggleSort,
} from "@/shared/components/SortableHeader";
import type { DbReportTemplate } from "@/shared/hooks";
import { reportTemplatesTableColumns } from "../data";
import { cardCls } from "../styles";
import type { ReportSortBy, ReportSortDir } from "../types";
import ReportTemplateRow from "./ReportTemplateRow";

type ReportTemplatesTableProps = {
  templates: DbReportTemplate[];
  sortBy: ReportSortBy;
  sortDir: ReportSortDir;
  onSortByChange: (value: ReportSortBy) => void;
  onSortDirChange: (value: ReportSortDir) => void;
  onSelect: (template: DbReportTemplate) => void;
};

const ReportTemplatesTable = ({
  templates,
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
  onSelect,
}: ReportTemplatesTableProps) => (
  <div className={cardCls}>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <SortableHeaderRow
            columns={reportTemplatesTableColumns}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={(key) =>
              toggleSort(key, sortBy, sortDir, onSortByChange, onSortDirChange)
            }
          />
        </thead>
        <tbody>
          {templates?.map((template) => (
            <ReportTemplateRow
              key={template.id}
              template={template}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ReportTemplatesTable;
