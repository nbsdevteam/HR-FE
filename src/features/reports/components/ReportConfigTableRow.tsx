import { useCallback } from "react";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { Button, StatusBadge } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import type { DbReportTemplate } from "@/shared/hooks";

type ReportConfigTableRowProps = {
  template: DbReportTemplate;
  categoryLabel: string;
  formatLabel: string;
  onEdit: (template: DbReportTemplate) => void;
  onArchive: (template: DbReportTemplate) => void;
  onRestore: (template: DbReportTemplate) => void;
  onHardDelete: (template: DbReportTemplate) => void;
};

const ReportConfigTableRow = ({
  template,
  categoryLabel,
  formatLabel,
  onEdit,
  onArchive,
  onRestore,
  onHardDelete,
}: ReportConfigTableRowProps) => {
  const handleEditClick = useCallback((): void => onEdit(template), [onEdit, template]);
  const handleArchiveClick = useCallback((): void => onArchive(template), [onArchive, template]);
  const handleRestoreClick = useCallback((): void => onRestore(template), [onRestore, template]);
  const handleHardDeleteClick = useCallback((): void => onHardDelete(template), [onHardDelete, template]);

  return (
    <tr className="border-t border-border/30">
      <td className="px-4 py-3 text-foreground text-sm" dir="ltr">{template.code}</td>
      <td className="px-4 py-3 text-foreground text-sm">
        <div>{template.name_ar}</div>
        {template.name_en && <div className="text-muted-foreground text-xs">{template.name_en}</div>}
      </td>
      <td className="px-4 py-3 text-muted-foreground text-sm">{categoryLabel}</td>
      <td className="px-4 py-3 text-muted-foreground text-sm">{formatLabel}</td>
      <td className="px-4 py-3 text-muted-foreground text-sm">{template.sort_order}</td>
      <td className="px-4 py-3">
        <StatusBadge colorClassName={template.is_active ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" : "border-muted text-muted-foreground bg-muted/20"}>
          {template.is_active ? arabicSource("reports.active_label") : arabicSource("reports.archived_label")}
        </StatusBadge>
        {!template.can_generate && (
          <StatusBadge colorClassName="border-amber-500/30 text-amber-500 bg-amber-500/10 ms-1.5">
            {arabicSource("reports.not_generatable_badge")}
          </StatusBadge>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="icon" icon={Pencil} onClick={handleEditClick} />
          {template.is_active ? (
            <Button variant="ghost" size="icon" icon={Archive} onClick={handleArchiveClick} />
          ) : (
            <Button variant="ghost" size="icon" icon={ArchiveRestore} onClick={handleRestoreClick} />
          )}
          <Button variant="ghost" size="icon" icon={Trash2} iconClassName="w-4 h-4 text-destructive" onClick={handleHardDeleteClick} />
        </div>
      </td>
    </tr>
  );
};

export default ReportConfigTableRow;
