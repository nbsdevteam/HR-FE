import { Trash2 } from "lucide-react";
import { arabicSource } from "@/i18n/source";
import type { DbDocumentType } from "@/shared/hooks";
import { SettingsToggle } from "./SettingsToggle";

type DocumentTypeListItemProps = {
  documentType: DbDocumentType;
  onToggleActive: () => void;
  onDelete: () => void;
};

export const DocumentTypeListItem = ({ documentType, onToggleActive, onDelete }: DocumentTypeListItemProps) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30">
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary">{documentType.code}</span>
      <div>
        <p className="text-sm text-foreground">{documentType.name_ar}</p>
        <p className="text-xs text-muted-foreground">
          {documentType.has_expiry ? `${arabicSource("settings.warning_before")} ${documentType.expiry_warning_days} ${arabicSource("common.days_2")}` : arabicSource("settings.without_ending")}
          {documentType.is_required && " " + arabicSource("settings.mandatory")}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <SettingsToggle on={documentType.is_active} onClick={onToggleActive} />
      <button
        onClick={onDelete}
        className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);
