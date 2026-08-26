import { DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbPosition } from "@/shared/hooks";
import DesignationManagementRow from "./DesignationManagementRow";

const HEADINGS = [
  arabicSource("common.name"),
  arabicSource("common.section"),
  arabicSource("org_structure.level_label"),
  arabicSource("org_structure.reports_to_label"),
  arabicSource("org_structure.headcount_label"),
  arabicSource("common.status"),
  "",
];

type DesignationManagementTableProps = {
  items: DbPosition[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (designation: DbPosition) => void;
  onDelete: (designation: DbPosition) => void;
  onRestore: (designation: DbPosition) => void;
};

const DesignationManagementTable = ({ items, canEdit, canDelete, onEdit, onDelete, onRestore }: DesignationManagementTableProps) => (
  <DataTable
    items={items}
    header={<TableHeaderRow headings={HEADINGS} />}
    emptyState={<EmptyState message={arabicSource("org_structure.no_job_titles_found")} />}
    renderRow={(designation) => (
      <DesignationManagementRow
        key={designation.id}
        designation={designation}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
      />
    )}
  />
);

export default DesignationManagementTable;
