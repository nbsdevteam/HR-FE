import type { ArabicSourceKey } from "@/i18n/source";
import type { MyTask } from "@/shared/hooks";
import { EXIT_BLOCKER_KEYS } from "./exitStages";

/** The heading each task `action` gets; an unknown action still lists, under the generic heading. */
export const MY_TASK_TITLE_KEYS: Record<string, ArabicSourceKey> = {
  submit_exit: "lifecycle.task_title_submit_exit",
  approve_exit: "lifecycle.task_title_approve_exit",
  clear_items: "lifecycle.task_title_clear_items",
  start_settlement: "lifecycle.task_title_start_settlement",
  confirm_settlement: "lifecycle.task_title_confirm_settlement",
  share_signature_link: "lifecycle.task_title_share_signature_link",
  final_approval: "lifecycle.task_title_final_approval",
};

/**
 * The task's `detail` line. For a held settlement it is a blocker code, which has
 * its own wording; elsewhere it is data (a rejection reason, an approval step's name).
 */
export const myTaskDetailText = (task: MyTask, translate: (key: ArabicSourceKey) => string): string => {
  if (!task.detail) return "";
  const blockerKey = task.action === "start_settlement" ? EXIT_BLOCKER_KEYS[task.detail] : undefined;
  return blockerKey ? translate(blockerKey) : task.detail;
};
