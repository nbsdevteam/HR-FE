/**
 * Public leave-request endpoints — deliberately separate from client.ts.
 *
 * `hrCall` always attaches the stored JWT; these routes are reached by
 * logged-out employees from a shared link, so nothing here may send an
 * Authorization header or touch the auth session.
 */
import type {
  PublicLeaveBalances,
  PublicLeaveEmployeeSearchResponse,
  PublicLeaveInfo,
  PublicLeaveStatusResult,
  PublicLeaveSubmitPayload,
  PublicLeaveSubmitResult,
} from "../types/publicLeave";

const API_BASE_CONFIGURED = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const ODOO_DB = import.meta.env.VITE_ODOO_DB || "";

// In dev, requests go out relative (same-origin) so they hit the Vite proxy
// (see vite.config.ts) instead of the absolute host directly — avoids CORS
// failures in local development. Production still uses the absolute host.
const BASE_URL = import.meta.env.DEV ? "" : API_BASE_CONFIGURED;

/** Error carrying the backend's machine-readable code so the UI can branch. */
export class PublicLeaveApiError extends Error {
  code: string;
  details: Record<string, unknown>;
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message || code);
    this.code = code;
    this.details = details;
  }
}

async function publicLeaveCall<T>(path: string, params: Record<string, unknown>): Promise<T> {
  if (!API_BASE_CONFIGURED) throw new PublicLeaveApiError("not_configured", "VITE_API_BASE is not configured");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (ODOO_DB) headers["X-Odoo-Database"] = ODOO_DB;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params, id: Date.now() }),
  });
  const envelope = await res.json();
  if (envelope.error) {
    throw new PublicLeaveApiError(
      "server_error",
      envelope.error?.data?.message || envelope.error?.message || "Server error",
    );
  }
  const result = envelope.result ?? envelope;
  if (result?.success === false) {
    throw new PublicLeaveApiError(result.error_code || "error", result.error || result.message || "", result);
  }
  return (result?.data ?? result) as T;
}

export const fetchPublicLeaveInfo = (token: string): Promise<PublicLeaveInfo> => {
  return publicLeaveCall<PublicLeaveInfo>("/api/hr/public/leave/info", { token });
}

export const searchPublicLeaveEmployees = (
  token: string,
  query: string,
): Promise<PublicLeaveEmployeeSearchResponse> => {
  return publicLeaveCall<PublicLeaveEmployeeSearchResponse>("/api/hr/public/leave/employees/search", {
    token,
    query,
  });
}

export const fetchPublicLeaveBalances = (
  token: string,
  employeeId: number,
  verification?: string,
): Promise<PublicLeaveBalances> => {
  return publicLeaveCall<PublicLeaveBalances>("/api/hr/public/leave/balances", {
    token,
    employee_id: employeeId,
    ...(verification !== undefined ? { verification } : {}),
  });
}

export const submitPublicLeaveRequest = (
  payload: PublicLeaveSubmitPayload,
): Promise<PublicLeaveSubmitResult> => {
  return publicLeaveCall<PublicLeaveSubmitResult>("/api/hr/public/leave/submit", payload);
}

export const fetchPublicLeaveStatus = (params: {
  token: string;
  employee_id: number;
  verification?: string;
  reference_code: string;
}): Promise<PublicLeaveStatusResult> => {
  return publicLeaveCall<PublicLeaveStatusResult>("/api/hr/public/leave/status", params);
}
