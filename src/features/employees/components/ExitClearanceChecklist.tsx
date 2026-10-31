import { memo } from "react";
import type { ExitChecklistView } from "../hooks/useExitChecklistView";
import ExitChecklistCategoryGroup from "./ExitChecklistCategoryGroup";

type ExitClearanceChecklistProps = {
  view: ExitChecklistView;
  onChecklistToggle: (checklistId: string, completed: boolean) => void;
};

/** The clearance checklist by team. */
const ExitClearanceChecklist = ({ view, onChecklistToggle }: ExitClearanceChecklistProps) => (
  <div>
    {view.categorizedChecklist.map(({ cat, catLabel, items }) => (
      <ExitChecklistCategoryGroup
        key={cat}
        catLabel={catLabel}
        items={items}
        itemNameById={view.itemNameById}
        onChecklistToggle={onChecklistToggle}
      />
    ))}
  </div>
);

export default memo(ExitClearanceChecklist);
