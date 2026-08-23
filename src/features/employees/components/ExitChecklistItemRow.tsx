import { memo, useCallback } from "react";
import { Check } from "lucide-react";
import { formatDate } from "@/i18n/format";

type ExitChecklistItemRowProps = {
  checklistId: string;
  itemName: string;
  isCompleted: boolean;
  completedAt: string | null | undefined;
  onToggle: (checklistId: string, completed: boolean) => void;
};

const ExitChecklistItemRow = ({ checklistId, itemName, isCompleted, completedAt, onToggle }: ExitChecklistItemRowProps) => {
  const handleToggle = useCallback((): void => {
    onToggle(checklistId, !isCompleted);
  }, [onToggle, checklistId, isCompleted]);

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/10 transition-colors">
      <button
        onClick={handleToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-all ${
          isCompleted ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/40"
        }`}
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
};

export default memo(ExitChecklistItemRow);
