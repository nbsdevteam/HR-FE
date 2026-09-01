import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { HrApiError } from "@/shared/api/client";

/** `/api/hr/admin/roles/upsert` and `/api/hr/admin/roles/delete` `error_code` → localized message key (backend Phase 2 §3). */
const ROLE_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  self_lockout_denied: "errors.self_lockout_denied",
  shared_role_delete_denied: "errors.shared_role_delete_denied",
};

/** Branch on `error.code`, never on message text, per the backend contract. */
export const roleErrorMessage = (error: unknown, fallback: string): string => {
  const code = (error as HrApiError | undefined)?.code;
  if (code && ROLE_ERROR_KEYS[code]) return arabicSource(ROLE_ERROR_KEYS[code]);
  return (error as Error | undefined)?.message || fallback;
};
