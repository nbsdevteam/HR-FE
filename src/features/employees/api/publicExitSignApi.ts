/**
 * Public End of Service signing endpoints — deliberately separate from client.ts.
 *
 * `hrCall` always attaches the stored JWT; these routes are reached by the
 * leaving employee from a one-time link, logged out, so nothing here may send
 * an Authorization header or touch the auth session.
 */
import { mapExitSettlement } from "@/shared/api/mappers";
import type {
  PublicExitClearanceLine,
  PublicExitSignDecision,
  PublicExitSignInfo,
  PublicExitSignState,
} from "../types/publicExitSign";

const API_BASE_CONFIGURED = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const ODOO_DB = import.meta.env.VITE_ODOO_DB || "";

// In dev, requests go out relative (same-origin) so they hit the Vite proxy
// (see vite.config.ts) instead of the absolute host directly.
const BASE_URL = import.meta.env.DEV ? "" : API_BASE_CONFIGURED;

/** Error carrying the backend's machine-readable code so the page can branch on it. */
export class PublicExitSignApiError extends Error {
  code: string;
  details: Record<string, unknown>;
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message || code);
    this.code = code;
    this.details = details;
  }
}

async function publicExitSignCall<T>(path: string, params: Record<string, unknown>): Promise<T> {
  if (!API_BASE_CONFIGURED) throw new PublicExitSignApiError("not_configured", "VITE_API_BASE is not configured");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (ODOO_DB) headers["X-Odoo-Database"] = ODOO_DB;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params, id: Date.now() }),
  });
  const envelope = await res.json();
  if (envelope.error) {
    throw new PublicExitSignApiError(
      "server_error",
      envelope.error?.data?.message || envelope.error?.message || "Server error",
    );
  }
  const result = envelope.result ?? envelope;
  if (result?.success === false) {
    throw new PublicExitSignApiError(result.error_code || "error", result.error || result.message || "", result);
  }
  return (result?.data ?? result) as T;
}

const mapClearanceLine = (r: any): PublicExitClearanceLine => {
  return { item: r.item || "", category: r.category || "", completed: Boolean(r.completed) };
}

export const mapPublicExitSignInfo = (r: any): PublicExitSignInfo => {
  return {
    state: (r?.state || "revoked") as PublicExitSignState,
    decidedAt: r?.decided_at || null,
    expiresAt: r?.expires_at || null,
    employeeName: r?.employee_name || "",
    companyName: r?.company_name || "",
    exitType: r?.exit_type || "",
    exitDate: r?.exit_date || "",
    lastWorkingDay: r?.last_working_day || "",
    clearance: Array.isArray(r?.clearance) ? r.clearance.map(mapClearanceLine) : [],
    settlement: mapExitSettlement(r?.settlement),
  };
}

/** Opening the link records a view; the state says whether it can still be signed. */
export const openPublicExitSign = async (token: string): Promise<PublicExitSignInfo> => {
  const data = await publicExitSignCall<unknown>("/api/hr/public/exit_sign/open", { token });
  return mapPublicExitSignInfo(data);
}

/** Signing needs the typed name and a drawn signature; declining may carry the reason as `notes`. */
export const decidePublicExitSign = (token: string, decision: PublicExitSignDecision): Promise<unknown> => {
  return publicExitSignCall<unknown>("/api/hr/public/exit_sign/decide", {
    token,
    accept: decision.accept,
    typed_name: decision.typedName,
    ...(decision.accept ? { signature_image: decision.signatureImage } : {}),
    ...(decision.notes ? { notes: decision.notes } : {}),
  });
}
