import i18n from "./index";
import { arabicSource } from "./source";

export type TranslationKeyMap = Readonly<Record<string, string>>;

export const employeeStatusKeys: TranslationKeyMap = {
  active: "common.is_active",
  [arabicSource("common.is_active")]: "common.is_active",
  leave: "common.leave",
  [arabicSource("common.leave")]: "common.leave",
  ended: "common.finished",
  terminated: "common.finished",
  [arabicSource("common.finished")]: "common.finished",
  pending: "common.pending",
  [arabicSource("common.pending")]: "common.pending",
};

export const workflowStatusKeys: TranslationKeyMap = {
  accepted: "common.accepted",
  approved: "common.accepted",
  [arabicSource("common.accepted")]: "common.accepted",
  rejected: "common.rejected_3",
  [arabicSource("common.rejected_3")]: "common.rejected_3",
  completed: "common.complete",
  [arabicSource("common.complete")]: "common.complete",
  canceled: "common.canceled",
  cancelled: "common.canceled",
  [arabicSource("common.canceled")]: "common.canceled",
};

/**
 * Translate a backend enum without ever exposing a raw i18n key.
 * Unknown codes remain readable so newly introduced backend values do not break the UI.
 */
export function translateBackendCode(
  code: string | null | undefined,
  mapping: TranslationKeyMap,
  fallback = "—",
): string {
  if (!code) return fallback;
  const key = mapping[code] ?? mapping[code.toLowerCase()];
  if (!key || !i18n.exists(key)) return code;
  return i18n.t(key);
}
