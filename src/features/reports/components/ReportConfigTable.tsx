import { useMemo } from "react";
import { DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbReportTemplate, ReportTemplateMetadata } from "@/shared/hooks";
import ReportConfigTableRow from "./ReportConfigTableRow";

const HEADINGS = [
  arabicSource("reports.code_label"),
  arabicSource("common.name"),
  arabicSource("reports.category_label"),
  arabicSource("reports.format_label"),
  arabicSource("reports.sort_order_label"),
  arabicSource("common.status"),
  "",
];

type ReportConfigTableProps = {
  items: DbReportTemplate[];
  metadata: ReportTemplateMetadata | null;
  onEdit: (template: DbReportTemplate) => void;
  onArchive: (template: DbReportTemplate) => void;
  onRestore: (template: DbReportTemplate) => void;
  onHardDelete: (template: DbReportTemplate) => void;
};

const ReportConfigTable = ({ items, metadata, onEdit, onArchive, onRestore, onHardDelete }: ReportConfigTableProps) => {
  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {};
    (metadata?.categories || []).forEach((c) => { map[c.value] = c.label; });
    return map;
  }, [metadata]);

  const formatLabels = useMemo(() => {
    const map: Record<string, string> = {};
    (metadata?.formats || []).forEach((f) => { map[f.value] = f.label; });
    return map;
  }, [metadata]);

  return (
    <DataTable
      items={items}
      header={<TableHeaderRow headings={HEADINGS} />}
      emptyState={<EmptyState message={arabicSource("reports.no_configurations_found")} />}
      renderRow={(template) => (
        <ReportConfigTableRow
          key={template.id}
          template={template}
          categoryLabel={categoryLabels[template.category] || template.category}
          formatLabel={formatLabels[template.format] || template.format}
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
          onHardDelete={onHardDelete}
        />
      )}
    />
  );
};

export default ReportConfigTable;
