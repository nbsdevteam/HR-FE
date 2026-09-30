import { memo } from "react";
import type { ExitClearanceSection } from "@/shared/hooks";
import type { ExitClearanceActions } from "../hooks/useExitClearanceActions";
import type { ExitChecklistLine } from "../types/lifecycle";
import ExitChecklistItemRow from "./ExitChecklistItemRow";
import ExitClearanceSectionPanel from "./ExitClearanceSectionPanel";

type ExitChecklistCategoryGroupProps = {
  catLabel: string;
  items: ExitChecklistLine[];
  itemNameById: ReadonlyMap<string, string>;
  /** The approval + signatures gate over this category, when the backend governs it. */
  section: ExitClearanceSection | undefined;
  clearanceActions: ExitClearanceActions;
  onChecklistToggle: (checklistId: string, completed: boolean) => void;
};

const ExitChecklistCategoryGroup = memo(({
  catLabel,
  items,
  itemNameById,
  section,
  clearanceActions,
  onChecklistToggle,
}: ExitChecklistCategoryGroupProps) => (
  <div className="mb-4">
    <p className="text-muted-foreground mb-2" style={{ fontSize: 12 }}>{catLabel}:</p>
    {section && <ExitClearanceSectionPanel section={section} actions={clearanceActions} />}
    <div className="space-y-1">
      {items.map(c => (
        <ExitChecklistItemRow
          key={c.id}
          checklistId={c.id}
          itemName={itemNameById.get(c.checklist_item_id) || ""}
          isCompleted={c.is_completed}
          completedAt={c.completed_at}
          canToggle={c.can_toggle === true}
          governed={section !== undefined}
          onToggle={onChecklistToggle}
        />
      ))}
    </div>
  </div>
));

export default ExitChecklistCategoryGroup;
