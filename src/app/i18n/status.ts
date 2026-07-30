import i18n from "./index";

export type TranslationKeyMap = Readonly<Record<string, string>>;

export const employeeStatusKeys: TranslationKeyMap = {
  active: "common.is_active",
  "نشط": "common.is_active",
  leave: "common.leave",
  "إجازة": "common.leave",
  ended: "common.finished",
  terminated: "common.finished",
  "منتهي": "common.finished",
  pending: "common.pending",
  "معلق": "common.pending",
};

export const workflowStatusKeys: TranslationKeyMap = {
  accepted: "common.accepted",
  approved: "common.accepted",
  "مقبول": "common.accepted",
  rejected: "common.rejected_3",
  "مرفوض": "common.rejected_3",
  completed: "common.complete",
  "مكتمل": "common.complete",
  canceled: "common.canceled",
  cancelled: "common.canceled",
  "ملغي": "common.canceled",
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
