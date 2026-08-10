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
 * Leave request statuses — Odoo states + legacy Arabic labels used in Supabase/FE.
 * Canonical filter values are arabicSource("common.pending|accepted|rejected_3").
 */
export const leaveStatusKeys: TranslationKeyMap = {
  // Odoo hr.leave states
  confirm: "common.pending",
  validate1: "common.pending",
  validate: "common.accepted",
  refuse: "common.rejected_3",
  cancel: "common.canceled",
  draft: "common.pending",
  // English / code aliases
  pending: "common.pending",
  approved: "common.accepted",
  accepted: "common.accepted",
  rejected: "common.rejected_3",
  refused: "common.rejected_3",
  canceled: "common.canceled",
  cancelled: "common.canceled",
  // Canonical Arabic (arabicSource)
  [arabicSource("common.pending")]: "common.pending",
  [arabicSource("common.accepted")]: "common.accepted",
  [arabicSource("common.rejected_3")]: "common.rejected_3",
  [arabicSource("common.canceled")]: "common.canceled",
  // Legacy display labels previously emitted by mappers
  "قيد الانتظار": "common.pending",
  "موافقة المدير": "common.pending",
  "مقبول": "common.accepted",
  "مرفوض": "common.rejected_3",
  "ملغي": "common.canceled",
};

/** Normalize any leave status string to the Arabic canonical used by Leave filters. */
export function normalizeLeaveStatus(status: string | null | undefined): string {
  if (!status) return "";
  const key = leaveStatusKeys[status] ?? leaveStatusKeys[status.toLowerCase()];
  if (!key) return status;
  return arabicSource(key as Parameters<typeof arabicSource>[0]);
}

export function isLeavePending(status: string | null | undefined): boolean {
  return normalizeLeaveStatus(status) === arabicSource("common.pending");
}

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
