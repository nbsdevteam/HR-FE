import { memo, useCallback } from "react";
import { Check } from "lucide-react";
import { formatDate } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";

type ExitChecklistItemRowProps = {
  checklistId: string;
  itemName: string;
  isCompleted: boolean;
  completedAt: string | null | undefined;
  /** HR, or the line's own clearance team, while the checklist is open. */
  canToggle: boolean;
  /** A clearance section completes this line; it is shown, never ticked by hand. */
  governed: boolean;
  onToggle: (checklistId: string, completed: boolean) => void;
};

const ExitChecklistItemRow = memo(({
  checklistId, itemName, isCompleted, completedAt, canToggle, governed, onToggle,
}: ExitChecklistItemRowProps) => {
  const toggleable = canToggle && !governed;
  const lockedTitle = arabicSource(governed ? "lifecycle.exit_clr_items_locked" : "lifecycle.exit_checklist_other_team");

  const handleToggle = useCallback((): void => {
    onToggle(checklistId, !isCompleted);
  }, [onToggle, checklistId, isCompleted]);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/10 transition-colors">
      <button
        type="button"
        onClick={handleToggle}
        disabled={!toggleable}
        aria-pressed={isCompleted}
        aria-label={itemName || undefined}
        title={toggleable ? undefined : lockedTitle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isCompleted ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/40"
        } ${toggleable ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
      >
        {isCompleted && <Check className="w-3 h-3 text-white" />}
      </button>
      <span className={`flex-1 ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`} style={{ fontSize: 13 }}>
        {itemName || "—"}
      </span>
      {completedAt && (
        <span className="text-muted-foreground" style={{ fontSize: 10 }}>
          {formatDate(completedAt)}
        </span>
      )}
    </div>
  );
});

export default ExitChecklistItemRow;
