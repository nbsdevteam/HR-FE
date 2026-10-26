import { memo } from "react";
import { formatDateTime } from "@/i18n/format";
import { arabicSource } from "@/i18n/source";
import type { MyTask } from "@/shared/hooks";
import type { MyTaskActionsBundle } from "../hooks/useMyTaskActions";
import { defaultExitTypeLabels, defaultLifecycleStatusLabels } from "../styles/lifecycle";
import { MY_TASK_TITLE_KEYS, myTaskDetailText } from "../utils/myTasks";
import MyTaskActions from "./MyTaskActions";

type MyTaskRowProps = {
  task: MyTask;
  actions: MyTaskActionsBundle;
  cardCls: string;
};

/** One thing waiting for the signed-in user: who it is about, why, and the action to take. */
const MyTaskRow = ({ task, actions, cardCls }: MyTaskRowProps) => {
  const titleKey = MY_TASK_TITLE_KEYS[task.action] ?? "lifecycle.task_title_generic";
  const detail = myTaskDetailText(task, arabicSource);

  return (
    <li className={`${cardCls} p-4 space-y-2`} data-task={`${task.action}:${task.exit_id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-foreground" dir="auto">{task.employee_name || "—"}</p>
          <p className="text-muted-foreground" style={{ fontSize: 12 }}>
            {defaultExitTypeLabels[task.exit_type] ?? task.exit_type}
            {task.stage && <> · {defaultLifecycleStatusLabels[task.stage] ?? task.stage}</>}
            {task.since && <> · <span dir="ltr">{formatDateTime(task.since, { timeZone: "Asia/Baghdad" })}</span></>}
          </p>
        </div>
        <span className="px-2 py-1 rounded-md border border-primary/30 bg-primary/10 text-primary" style={{ fontSize: 12 }}>
          {arabicSource(titleKey)}
        </span>
      </div>
      {detail && <p className="text-amber-400" style={{ fontSize: 12 }} dir="auto">{detail}</p>}
      <MyTaskActions task={task} actions={actions} />
    </li>
  );
};

export default memo(MyTaskRow);
