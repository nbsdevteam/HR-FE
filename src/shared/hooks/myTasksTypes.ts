/** What a My tasks row asks the signed-in user to do (backend `/api/hr/my_tasks` `action`). */
export type MyTaskAction =
  | "submit_exit"
  | "approve_exit"
  | "clear_items"
  | "start_settlement"
  | "confirm_settlement"
  | "share_signature_link"
  | "final_approval";

/** A checklist line the user's team still has to tick (`clear_items`). */
export interface MyTaskItem {
  line_id: string;
  item: string;
  category: string;
}

export interface MyTask {
  action: MyTaskAction | (string & {});
  exit_id: string;
  employee_id: string;
  employee_name: string;
  exit_type: string;
  stage: string;
  /** ISO datetime with a +03:00 offset. */
  since: string | null;
  /** A rejection reason, a step name or a blocker code, depending on `action`. */
  detail: string;
  items: MyTaskItem[];
}
