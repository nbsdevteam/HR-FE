import { arabicSource, type ArabicSourceKey } from "@/i18n/source";
import type { DeviceSyncResult } from "@/shared/api/deviceSync";
import { errorMessage } from "./errorMessage";

/** Written by the FE itself: the device-sync service could not be reached at all. */
export const DEVICE_SYNC_UNREACHABLE = "device_sync_unreachable";

/** device-sync `error_code` → localized message key (sync-service.mjs `/device/*` routes). */
const DEVICE_SYNC_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  [DEVICE_SYNC_UNREACHABLE]: "employees.device_sync_error_unreachable",
  device_number_taken: "employees.device_sync_error_number_taken",
  device_number_not_in_odoo: "employees.device_sync_error_not_in_odoo",
  employee_not_active: "employees.device_sync_error_not_active",
};

/**
 * The `error` a failed device-sync call reports to Odoo. A typed failure is
 * stored as its code — `device_number_taken: <name the terminal has>` — so
 * the banner localizes it on read, whichever language the reporter used.
 */
export const deviceSyncFailure = (res: DeviceSyncResult<{ existing_name?: string }>): string | undefined => {
  if (!res.error_code) return res.error;
  return res.existing_name ? `${res.error_code}: ${res.existing_name}` : res.error_code;
};

/**
 * A device-sync call that threw. `fetch` rejects with a `TypeError` only when
 * the service is unreachable; a `SyntaxError` is a non-JSON answer — a proxy's
 * 502 page — which means the same thing to HR.
 */
export const deviceSyncThrown = (error: unknown): string =>
  error instanceof TypeError || error instanceof SyntaxError ? DEVICE_SYNC_UNREACHABLE : errorMessage(error);

/** A stored `last_error` for display: a device-sync code is localized, anything else is shown as sent. */
export const deviceSyncErrorMessage = (lastError: string): string => {
  const separator = lastError.indexOf(": ");
  const code = separator === -1 ? lastError : lastError.slice(0, separator);
  const key = DEVICE_SYNC_ERROR_KEYS[code];
  if (!key) return lastError;
  const detail = separator === -1 ? "" : lastError.slice(separator + 2);
  return detail ? `${arabicSource(key)} (${detail})` : arabicSource(key);
};
