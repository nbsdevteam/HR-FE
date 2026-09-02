import type { HrApiError } from "@/shared/api/client";
import { arabicSource, type ArabicSourceKey } from "@/i18n/source";

/**
 * The backend rejects a bad `photo` with a typed `error_code` rather than an
 * HTTP error, and — like birth date — a rejected payload writes *nothing*, not
 * even the other fields in the same patch. So this belongs next to the avatar
 * control itself, not in the generic form-level error box.
 */
const PHOTO_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  invalid_photo: "employees.invalid_photo",
  photo_too_large: "employees.photo_too_large",
};

/** Field-level message for a rejected photo, or `null` when the failure belongs on the form. */
export const photoFieldError = (error: unknown): string | null => {
  const code = (error as HrApiError | null)?.code;
  const key = code ? PHOTO_ERROR_KEYS[code] : undefined;
  return key ? arabicSource(key) : null;
};
