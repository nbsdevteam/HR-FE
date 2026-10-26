import type { ArabicSourceKey } from "@/i18n/source";
import { custodyStatusLabels } from "./custodyStatus";
import { defaultLifecycleStatusLabels } from "../styles/lifecycle";

/**
 * The backend names the actions it offers on the lifecycle summary. Which ones
 * are available is its call — these only recognise a start or an edit of End of
 * Service among the codes it sent, and never decide availability themselves.
 */
const START_END_OF_SERVICE = /start.*(end_of_service|exit|eos)|(end_of_service|exit|eos).*start/;
const EDIT_END_OF_SERVICE = /(edit|open|continue|view|manage).*(end_of_service|exit|eos)|(end_of_service|exit|eos).*(edit|open|continue|view|manage)/;

export const canStartEndOfService = (actions: readonly string[]): boolean =>
  actions.some(action => START_END_OF_SERVICE.test(action));

export const canEditEndOfService = (actions: readonly string[]): boolean =>
  actions.some(action => EDIT_END_OF_SERVICE.test(action));

/** Labels for the count buckets the summary carries; an unknown bucket shows its own name. */
const DOCUMENT_COUNT_LABELS: Record<string, string> = {
  valid: defaultLifecycleStatusLabels.valid,
  expiring_soon: defaultLifecycleStatusLabels.expiring_soon,
  expired: defaultLifecycleStatusLabels.expired,
  missing: defaultLifecycleStatusLabels.missing,
};

export const TOTAL_COUNT_KEY = "total";
export const TOTAL_COUNT_LABEL_KEY: ArabicSourceKey = "common.total";

export const documentCountLabel = (bucket: string): string => DOCUMENT_COUNT_LABELS[bucket] ?? bucket;

export const custodyCountLabel = (bucket: string): string =>
  (custodyStatusLabels as Record<string, string>)[bucket] ?? bucket;

/** A stage code as the user reads it; an unknown stage shows as sent. */
export const exitStageLabel = (stage: string): string => defaultLifecycleStatusLabels[stage] ?? stage;
