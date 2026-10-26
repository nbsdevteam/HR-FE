import { memo } from "react";
import { arabicSource } from "@/i18n/source";
import type { MyTask } from "@/shared/hooks";
import { MY_TASK_TITLE_KEYS } from "../utils/myTasks";

type ExitYourTurnBadgeProps = {
  task: MyTask;
};

/** The backend lists this process in the user's My tasks; the badge names the action waiting. */
const ExitYourTurnBadge = ({ task }: ExitYourTurnBadgeProps) => {
  const titleKey = MY_TASK_TITLE_KEYS[task.action];

  return (
    <span className="inline-flex items-center gap-1.5" data-exit-your-turn={task.action}>
      <span className="px-2 py-0.5 rounded-md bg-primary/20 border border-primary/40 text-primary" style={{ fontSize: 11 }}>
        {arabicSource("lifecycle.exit_progress_your_turn")}
      </span>
      {titleKey && <span className="text-muted-foreground" style={{ fontSize: 11 }}>{arabicSource(titleKey)}</span>}
    </span>
  );
};

export default memo(ExitYourTurnBadge);
