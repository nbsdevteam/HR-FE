import DataTable from "@/shared/components/DataTable";
import SortableHeaderRow, {
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
}: ReportTemplatesTableProps) => {
  const handleSort = (key: ReportSortBy): void => {
    toggleSort(key, sortBy, sortDir, onSortByChange, onSortDirChange);
  };

  return (
  <DataTable
    wrapperClassName={cardCls}
    tableClassName="w-full text-sm"
    items={templates || []}
    header={
      <SortableHeaderRow
        columns={reportTemplatesTableColumns}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />
    }
    renderRow={(template) => (
      <ReportTemplateRow
        key={template.id}
        template={template}
        onSelect={onSelect}
      />
    )}
  />
  );
};

export default ReportTemplatesTable;
