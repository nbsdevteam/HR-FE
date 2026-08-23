import { memo } from "react";
import type { ExitChecklistLine } from "../types/lifecycle";
import ExitChecklistItemRow from "./ExitChecklistItemRow";

type ExitChecklistCategoryGroupProps = {
  catLabel: string;
  items: ExitChecklistLine[];
  itemNameById: ReadonlyMap<string, string>;
  onChecklistToggle: (checklistId: string, completed: boolean) => void;
};

const ExitChecklistCategoryGroup = ({
  catLabel,
  items,
  itemNameById,
  onChecklistToggle,
}: ExitChecklistCategoryGroupProps) => (
  <div className="mb-4">
    <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>{catLabel}:</p>
    <div className="space-y-1">
      {items.map(c => (
        <ExitChecklistItemRow
          key={c.id}
          checklistId={c.id}
          itemName={itemNameById.get(c.checklist_item_id) || ""}
          isCompleted={c.is_completed}
          completedAt={c.completed_at}
          onToggle={onChecklistToggle}
        />
      ))}
    </div>
  </div>
);

export default memo(ExitChecklistCategoryGroup);
