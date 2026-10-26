import { memo } from "react";
import type { ExitClearanceActions } from "../hooks/useExitClearanceActions";
import type { ExitChecklistView } from "../hooks/useExitChecklistView";
import ExitChecklistCategoryGroup from "./ExitChecklistCategoryGroup";

type ExitClearanceChecklistProps = {
  view: ExitChecklistView;
  clearanceActions: ExitClearanceActions;
  onChecklistToggle: (checklistId: string, completed: boolean) => void;
};

/** The clearance checklist by team, each team's lines under the section that governs them. */
const ExitClearanceChecklist = ({ view, clearanceActions, onChecklistToggle }: ExitClearanceChecklistProps) => (
  <div>
    {view.categorizedChecklist.map(({ cat, catLabel, items }) => (
      <ExitChecklistCategoryGroup
        key={cat}
        catLabel={catLabel}
        items={items}
        itemNameById={view.itemNameById}
        section={view.sectionByCategory.get(cat)}
        clearanceActions={clearanceActions}
        onChecklistToggle={onChecklistToggle}
      />
    ))}
  </div>
);

export default memo(ExitClearanceChecklist);
