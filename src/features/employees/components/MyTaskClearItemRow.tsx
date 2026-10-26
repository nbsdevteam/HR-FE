import { memo, useCallback } from "react";
import { Check } from "lucide-react";
import type { MyTaskItem } from "@/shared/hooks";
import { defaultChecklistCategoryLabels } from "../styles/lifecycle";

type MyTaskClearItemRowProps = {
  item: MyTaskItem;
  onTick: (lineId: string) => void;
};

/** One open clearance line the user's team owns; ticking it is the same call as on the process. */
const MyTaskClearItemRow = ({ item, onTick }: MyTaskClearItemRowProps) => {
  const handleTick = useCallback((): void => {
    onTick(item.line_id);
  }, [item.line_id, onTick]);

  return (
    <li className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/10">
      <button
        type="button"
        onClick={handleTick}
        aria-label={item.item}
        className="w-5 h-5 rounded border-2 border-muted-foreground/40 flex items-center justify-center cursor-pointer hover:border-emerald-500"
        data-task-tick={item.line_id}
      >
        <Check className="w-3 h-3 text-transparent" />
      </button>
      <span className="flex-1 text-foreground" style={{ fontSize: 13 }} dir="auto">{item.item}</span>
      <span className="text-muted-foreground" style={{ fontSize: 11 }}>
        {defaultChecklistCategoryLabels[item.category] ?? item.category}
      </span>
    </li>
  );
};

export default memo(MyTaskClearItemRow);
