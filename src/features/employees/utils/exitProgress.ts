import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { AppLanguage } from "@/i18n";
import type {
  DbExitProcess,
  ExitProgressStageState,
  ExitRequiredItem,
  ExitWaitingOn,
  MyTask,
} from "@/shared/hooks";
import { EXIT_SIGNING_LINK_STATE_KEYS } from "./exitStages";

/** Days in a stage before the count turns amber, then red. These can become a setting later. */
export const EXIT_STAGE_WARN_DAYS = 3;
export const EXIT_STAGE_LATE_DAYS = 7;

export type ExitDaysTone = "normal" | "warn" | "late";

export const exitDaysTone = (days: number): ExitDaysTone =>
  days >= EXIT_STAGE_LATE_DAYS ? "late" : days >= EXIT_STAGE_WARN_DAYS ? "warn" : "normal";

export const EXIT_DAYS_TONE_CLASSES: Record<ExitDaysTone, string> = {
  normal: "text-muted-foreground",
  warn: "text-amber-400",
  late: "text-red-400",
};

/** The dot of one stage in the stepper, by the state the backend reports. */
export const EXIT_STAGE_DOT_CLASSES: Record<ExitProgressStageState, string> = {
  done: "bg-emerald-500 border-emerald-500 text-white",
  current: "bg-primary/20 border-primary ring-2 ring-primary/40",
  todo: "border-muted-foreground/40",
  skipped: "border-dashed border-muted-foreground/50",
  cancelled: "bg-red-500/15 border-red-500 text-red-400",
  not_reached: "border-muted-foreground/20 opacity-50",
};

/** Owners that are not a clearance team; the teams use the checklist category labels. */
const OWNER_LABEL_KEYS: Record<string, ArabicSourceKey> = {
  approver: "lifecycle.exit_owner_approver",
  employee: "common.employee",
  hr_manager: "common.human_resources_manager",
};

/** An unknown owner shows as sent. */
export const exitOwnerLabel = (owner: string, categoryLabels: Record<string, string>): string => {
  const key = OWNER_LABEL_KEYS[owner];
  return categoryLabels[owner] ?? (key ? arabicSource(key) : owner);
};

/** Who is waited on: the open approval step names its people, every other owner is a role or team. */
export const exitWaitingOnLabel = (entry: ExitWaitingOn, categoryLabels: Record<string, string>): string =>
  entry.owner === "approver" && entry.people.length > 0
    ? entry.people.map(person => person.name).join(", ")
    : exitOwnerLabel(entry.owner, categoryLabels);

const itemName = (item: ExitRequiredItem, lang: AppLanguage): string =>
  (lang === "ar" ? item.label_ar || item.label : item.label || item.label_ar) || item.code;

const signatureDetailText = (detail: string): string => {
  if (detail === "not_sent") return arabicSource("lifecycle.exit_sig_not_sent");
  const key = EXIT_SIGNING_LINK_STATE_KEYS[detail as keyof typeof EXIT_SIGNING_LINK_STATE_KEYS];
  return key ? arabicSource(key) : detail;
};

/**
 * One required item as the user reads it. Item names come from the data in the
 * active language; the wording around them is catalogued copy. An unknown code
 * shows its own label or code rather than being hidden.
 */
export const requiredItemText = (item: ExitRequiredItem, lang: AppLanguage): string => {
  const name = itemName(item, lang);
  switch (item.code) {
    case "submit_for_approval": {
      const base = arabicSource("lifecycle.exit_submit_for_approval");
      return item.detail ? `${base} — ${arabicSource("lifecycle.exit_req_returned")}: ${item.detail}` : base;
    }
    case "approval_step": {
      const base = `${arabicSource("lifecycle.exit_req_approval_step")}: ${name}`;
      return item.people.length > 0 ? `${base} (${item.people.map(person => person.name).join(", ")})` : base;
    }
    case "custody_item":
      return `${arabicSource("lifecycle.exit_req_custody_item")}: ${name}`;
    case "move_to_settlement":
      return arabicSource("lifecycle.exit_req_move_to_settlement");
    case "confirm_settlement":
      return arabicSource("lifecycle.exit_req_confirm_settlement");
    case "employee_signature": {
      const base = arabicSource("lifecycle.exit_req_employee_signature");
      return item.detail ? `${base} (${signatureDetailText(item.detail)})` : base;
    }
    case "final_approval":
      return arabicSource("lifecycle.task_title_final_approval");
    default:
      return name;
  }
};

/** Steps that wait for everything before them; shown held while something precedes them. */
const SEQUENTIAL_CODES: ReadonlySet<string> = new Set(["move_to_settlement", "employee_signature", "final_approval"]);

export const isHeldRequiredItem = (item: ExitRequiredItem, index: number): boolean =>
  index > 0 && SEQUENTIAL_CODES.has(item.code);

/** What a row's button does; the backend's `my_actions` decides whether the button exists at all. */
export type ExitRowAction = "submit" | "approve" | "reject" | "tick" | "start_settlement" | "confirm" | "issue" | "complete";

export type ExitRowActionSpec = {
  action: ExitRowAction;
  labelKey: ArabicSourceKey;
  variant: "info" | "success" | "destructive" | "warning" | "outline";
};

/** `canTick` is whether the signed-in user may tick this checklist line by hand now. */
export const exitRowActions = (
  item: ExitRequiredItem,
  myActions: readonly string[],
  canTick: boolean,
): ExitRowActionSpec[] => {
  const specs: ExitRowActionSpec[] = [];
  const allowed = (action: string): boolean => myActions.includes(action);
  switch (item.code) {
    case "submit_for_approval":
      if (allowed("submit")) specs.push({ action: "submit", labelKey: "lifecycle.exit_submit_for_approval", variant: "info" });
      break;
    case "approval_step":
      if (allowed("approve")) specs.push({ action: "approve", labelKey: "lifecycle.exit_approval_approve", variant: "success" });
      if (allowed("reject")) specs.push({ action: "reject", labelKey: "lifecycle.exit_approval_reject", variant: "destructive" });
      break;
    case "clearance_item":
      if (canTick) specs.push({ action: "tick", labelKey: "lifecycle.exit_progress_mark_done", variant: "outline" });
      break;
    case "move_to_settlement":
      if (allowed("start_settlement")) specs.push({ action: "start_settlement", labelKey: "lifecycle.exit_to_settlement", variant: "warning" });
      break;
    case "confirm_settlement":
      if (allowed("confirm_settlement")) specs.push({ action: "confirm", labelKey: "lifecycle.exit_settlement_confirm", variant: "success" });
      break;
    case "employee_signature":
      if (allowed("issue_signature")) specs.push({ action: "issue", labelKey: "lifecycle.exit_signing_issue", variant: "outline" });
      break;
    case "final_approval":
      if (allowed("complete")) specs.push({ action: "complete", labelKey: "lifecycle.task_title_final_approval", variant: "success" });
      break;
  }
  return specs;
};

/** The My tasks entry for a process, if the backend lists one for the signed-in user. */
export const taskFor = (process: Pick<DbExitProcess, "id">, tasks: readonly MyTask[]): MyTask | null =>
  tasks.find(task => task.exit_id === process.id) ?? null;

/** A stage's state as the backend reports it; a stage it does not list reads as not reached yet. */
export const exitStageState = (proc: Pick<DbExitProcess, "progress">, key: string): ExitProgressStageState =>
  proc.progress.stages.find(stage => stage.key === key)?.state ?? "todo";

/** When each stage began, from the timestamps the record already carries. */
export const exitStageDates = (proc: DbExitProcess): Record<string, string | null> => ({
  in_progress: proc.created_at || null,
  approval: proc.approval_submitted_at,
  clearance: proc.clearance_started_at,
  settlement: proc.settlement_started_at,
  completed: proc.completed_at,
});
