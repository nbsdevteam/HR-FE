import { memo, useCallback, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { useLocalizedName } from "@/i18n/useLocalizedName";
import SettingsToggle from "./SettingsToggle";

/** Shape every settings "type" record shares (contract types, document types). */
type NamedTypeRecord = {
  id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  is_active: boolean;
};

type TypeListItemProps<T extends NamedTypeRecord> = {
  item: T;
  descriptionLine: (item: T) => ReactNode;
  onToggleActive: (item: T) => void;
  onDelete: (id: string) => void;
};

/**
 * Row shared by ContractTypesCard/DocumentTypesCard's lists — the same
 * code-badge + name + description-line + toggle + delete shape, previously
 * duplicated as ContractTypeListItem/DocumentTypeListItem. LeaveTypeListItem
 * keeps its own component: its row shape (color dot, multiple badges) is
 * genuinely different, not just a different description line.
 */
const TypeListItemInner = <T extends NamedTypeRecord,>({
  item,
  descriptionLine,
  onToggleActive,
  onDelete,
}: TypeListItemProps<T>) => {
  const { primary } = useLocalizedName(item.name_ar, item.name_en);

  const handleToggleActive = useCallback((): void => {
    onToggleActive(item);
  }, [onToggleActive, item]);

  const handleDelete = useCallback((): void => {
    onDelete(item.id);
  }, [onDelete, item.id]);

  return (
    <div className="flex items-center flex-wrap gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/10 text-primary shrink-0">
          {item.code}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-foreground truncate" data-i18n-ignore>{primary}</p>
          <p className="text-xs text-muted-foreground truncate">{descriptionLine(item)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <SettingsToggle on={item.is_active} onClick={handleToggleActive} />
        <button
          onClick={handleDelete}
          className="p-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

const TypeListItem = memo(TypeListItemInner) as typeof TypeListItemInner;

export default TypeListItem;
export type { NamedTypeRecord };
