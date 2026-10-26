import type { ArabicSourceKey } from "@/i18n/source";
import { PublicExitSignApiError } from "../api/publicExitSignApi";

/** The backend refuses a signature image over 300 KB (`signature_too_large`). */
export const MAX_SIGNATURE_BYTES = 300 * 1024;

/** Decoded size of a base64 data URL, so an oversized drawing is caught before it is sent. */
export const dataUrlBytes = (dataUrl: string): number => {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
};

/** `/api/hr/public/exit_sign/*` `error_code` → the message the employee reads. */
const SIGN_ERROR_KEYS: Record<string, ArabicSourceKey> = {
  link_not_found: "public_exit_sign.error_link_not_found",
  sign_link_closed: "public_exit_sign.error_link_closed",
  signature_required: "public_exit_sign.error_signature_required",
  sign_name_required: "public_exit_sign.error_name_required",
  signature_invalid: "public_exit_sign.error_signature_invalid",
  signature_too_large: "public_exit_sign.error_signature_too_large",
  rate_limited: "public_exit_sign.error_rate_limited",
  decision_required: "public_exit_sign.error_decision_required",
};

/** Branches on the code, never on server text; an unknown code gets the generic message. */
export const publicExitSignErrorKey = (error: unknown): ArabicSourceKey =>
  (error instanceof PublicExitSignApiError ? SIGN_ERROR_KEYS[error.code] : undefined) ?? "public_exit_sign.error_generic";

/** What a link in each closed state tells the employee. */
export const CLOSED_LINK_KEYS: Record<string, ArabicSourceKey> = {
  signed: "public_exit_sign.closed_signed",
  rejected: "public_exit_sign.closed_rejected",
  expired: "public_exit_sign.closed_expired",
  revoked: "public_exit_sign.closed_revoked",
};
