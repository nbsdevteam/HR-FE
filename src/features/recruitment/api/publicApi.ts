/**
 * Public candidate endpoints — deliberately separate from client.ts.
 *
 * `hrCall` always attaches the stored JWT; these routes are reached by
 * logged-out candidates, so nothing here may send an Authorization header or
 * touch the auth session.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const ODOO_DB = import.meta.env.VITE_ODOO_DB || "";

export interface PublicJob {
  id: number;
  title: string;
  department: string;
  location: string;
  job_type: string;
  description?: string;
  requirements?: string[];
  salary_range?: string;
  deadline?: string | null;
}

export interface ApplyLinkInfo {
  link_scope: "job" | "all_open";
  unusable_reason: string;
  company_name: string;
  job: PublicJob | null;
  open_positions: PublicJob[];
  max_resume_mb: number;
  accepted_formats: string[];
}

export interface ApplySubmitResult {
  reference_code: string;
  job_title: string;
  resubmitted: boolean;
}

/** Error carrying the backend's machine-readable code so the UI can branch. */
export class PublicApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message || code);
    this.code = code;
  }
}

async function publicCall<T>(path: string, params: Record<string, unknown>): Promise<T> {
  if (!BASE_URL) throw new PublicApiError("not_configured", "VITE_API_BASE is not configured");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (ODOO_DB) headers["X-Odoo-Database"] = ODOO_DB;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", method: "call", params, id: Date.now() }),
  });
  const envelope = await res.json();
  if (envelope.error) {
    throw new PublicApiError(
      "server_error",
      envelope.error?.data?.message || envelope.error?.message || "Server error",
    );
  }
  const result = envelope.result ?? envelope;
  if (result?.success === false) {
    throw new PublicApiError(result.error || "error", result.message || result.error || "");
  }
  return (result?.data ?? result) as T;
}

export const fetchApplyLinkInfo = (token: string): Promise<ApplyLinkInfo> => {
  return publicCall<ApplyLinkInfo>("/api/hr/public/apply/info", { token });
}

export const submitApplication = (payload: {
  token: string;
  job_opening_id?: number | null;
  name: string;
  email: string;
  phone: string;
  city?: string;
  expected_salary?: number | null;
  file_name: string;
  file_data: string;
  consent: boolean;
  hp?: string;
}): Promise<ApplySubmitResult> => {
  return publicCall<ApplySubmitResult>("/api/hr/public/apply/submit", payload);
}

export const fetchApplicationStatus = (
  token: string,
  referenceCode: string,
  email: string,
): Promise<{ reference_code: string; job_title: string; submitted_at: string | null; state: string }> => {
  return publicCall("/api/hr/public/apply/status", {
    token,
    reference_code: referenceCode,
    email,
  });
}
