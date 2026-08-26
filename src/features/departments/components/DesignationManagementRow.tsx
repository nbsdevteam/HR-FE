import { useCallback } from "react";
import { ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { Button, StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbPosition } from "@/shared/hooks";

type DesignationManagementRowProps = {
  designation: DbPosition;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (designation: DbPosition) => void;
  onDelete: (designation: DbPosition) => void;
  onRestore: (designation: DbPosition) => void;
};

const DesignationManagementRow = ({
  designation,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onRestore,
}: DesignationManagementRowProps) => {
  const handleEditClick = useCallback((): void => onEdit(designation), [onEdit, designation]);
  const handleDeleteClick = useCallback((): void => onDelete(designation), [onDelete, designation]);
  const handleRestoreClick = useCallback((): void => onRestore(designation), [onRestore, designation]);

  return (
    <tr className="border-t border-border/30">
      <td className="px-4 py-3 text-foreground text-sm">
        <div>{designation.title_en || designation.title_ar}</div>
        {designation.title_ar && <div className="text-muted-foreground text-xs" dir="rtl">{designation.title_ar}</div>}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-sm">{designation.department_name || "—"}</td>
      <td className="px-4 py-3 text-muted-foreground text-sm">{designation.level}</td>
      <td className="px-4 py-3 text-muted-foreground text-sm">{designation.reports_to_job_name || "—"}</td>
      <td className="px-4 py-3 text-muted-foreground text-sm">{designation.employee_count}/{designation.max_headcount}</td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={designation.is_active ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" : "border-muted text-muted-foreground bg-muted/20"}>
          {designation.is_active ? arabicSource("org_structure.active_label") : arabicSource("org_structure.archived_label")}
        </StatusBadge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          {canEdit && <Button variant="ghost" size="icon" icon={Pencil} onClick={handleEditClick} />}
          {canDelete && (
            designation.is_active ? (
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

export default DesignationManagementRow;
