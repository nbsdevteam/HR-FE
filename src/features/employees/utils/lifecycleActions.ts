import type { ArabicSourceKey } from "@/i18n/source";
import { defaultLifecycleStatusLabels } from "../styles/lifecycle";

/** The exact codes the lifecycle summary offers; which are present is the backend's call. */
export const START_EXIT = "start_exit";
export const EDIT_EXIT = "edit_exit";

export const canStartEndOfService = (actions: readonly string[]): boolean => actions.includes(START_EXIT);

export const canEditEndOfService = (actions: readonly string[]): boolean => actions.includes(EDIT_EXIT);

/** A stage code as the user reads it; an unknown stage shows as sent. */
export const exitStageLabel = (stage: string): string => defaultLifecycleStatusLabels[stage] ?? stage;

/** Who an open stage waits on, as the backend names it; an unknown value shows as sent. */
const WAITING_ON_KEYS: Record<string, ArabicSourceKey> = {
  HR: "common.human_resources",
  "Clearance teams": "lifecycle.exit_waiting_clearance_teams",
  Finance: "common.finance",
};

export const waitingOnKey = (waitingOn: string): ArabicSourceKey | undefined => WAITING_ON_KEYS[waitingOn];
