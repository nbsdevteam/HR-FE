import { useCallback } from "react";
import { ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { Button, StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbDepartment } from "@/shared/hooks";

type DepartmentManagementRowProps = {
  department: DbDepartment;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (department: DbDepartment) => void;
  onDelete: (department: DbDepartment) => void;
  onRestore: (department: DbDepartment) => void;
};

const DepartmentManagementRow = ({
  department,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onRestore,
}: DepartmentManagementRowProps) => {
  const handleEditClick = useCallback((): void => onEdit(department), [onEdit, department]);
  const handleDeleteClick = useCallback((): void => onDelete(department), [onDelete, department]);
  const handleRestoreClick = useCallback((): void => onRestore(department), [onRestore, department]);

  return (
    <tr className="border-t border-border/30">
      <td className="px-4 py-3">
        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: department.color }} />
      </td>
      <td className="px-4 py-3 text-foreground text-sm" data-i18n-ignore>
        <div>{department.name_en || department.name}</div>
        {department.name_ar && <div className="text-muted-foreground text-xs" dir="rtl">{department.name_ar}</div>}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-sm" data-i18n-ignore>{department.parent_name || "—"}</td>
      <td className="px-4 py-3 text-muted-foreground text-sm">{department.employee_count}</td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={department.is_active ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" : "border-muted text-muted-foreground bg-muted/20"}>
          {department.is_active ? arabicSource("org_structure.active_label") : arabicSource("org_structure.archived_label")}
        </StatusBadge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {canEdit && <Button variant="ghost" size="icon" icon={Pencil} onClick={handleEditClick} />}
          {canDelete && (
            department.is_active ? (
              <Button variant="ghost" size="icon" icon={Trash2} iconClassName="w-4 h-4 text-destructive" onClick={handleDeleteClick} />
            ) : (
              <Button variant="ghost" size="icon" icon={ArchiveRestore} onClick={handleRestoreClick} />
            )
          )}
        </div>
      </td>
    </tr>
  );
};

export default DepartmentManagementRow;
