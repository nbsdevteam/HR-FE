import { DataTable, EmptyState, TableHeaderRow } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment } from "@/shared/hooks";
import DepartmentManagementRow from "./DepartmentManagementRow";

const HEADINGS = [
  "",
  arabicSource("common.name"),
  arabicSource("org_structure.parent_department_label"),
  arabicSource("org_structure.employee_count_label"),
  arabicSource("common.status"),
  "",
];

type DepartmentManagementTableProps = {
  items: DbDepartment[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (department: DbDepartment) => void;
  onDelete: (department: DbDepartment) => void;
  onRestore: (department: DbDepartment) => void;
};

const DepartmentManagementTable = ({ items, canEdit, canDelete, onEdit, onDelete, onRestore }: DepartmentManagementTableProps) => (
  <DataTable
    items={items}
    header={<TableHeaderRow headings={HEADINGS} />}
    emptyState={<EmptyState message={arabicSource("org_structure.no_departments_found")} />}
    renderRow={(department) => (
      <DepartmentManagementRow
        key={department.id}
        department={department}
        canEdit={canEdit}
        canDelete={canDelete}
        onEdit={onEdit}
        onDelete={onDelete}
        onRestore={onRestore}
      />
    )}
  />
);

export default DepartmentManagementTable;
