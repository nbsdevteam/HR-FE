/**
 * Odoo JSON-RPC client for Lugal HR APIs.
 * Enable by setting VITE_API_BASE (and optionally VITE_ODOO_DB).
 */

import type { HrPermissionState } from "../permissions";
import { emptyPermissionState } from "../permissions";

const BASE_URL = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const ODOO_DB = import.meta.env.VITE_ODOO_DB || "";

const TOKEN_KEY = "lugal_hr_access_token";
const REFRESH_KEY = "lugal_hr_refresh_token";
const USER_KEY = "lugal_hr_user";

export type HrApiErrorCode = "forbidden" | "unauthorized" | "error";

export class HrApiError extends Error {
  code: HrApiErrorCode;

  constructor(message: string, code: HrApiErrorCode = "error") {
    super(message);
    this.name = "HrApiError";
    this.code = code;
  }
}

export function isForbiddenError(err: unknown): boolean {
  return err instanceof HrApiError && err.code === "forbidden";
}

function classifyApiMessage(msg: string): HrApiErrorCode {
  const m = (msg || "").toLowerCase();
  if (m.includes("unauthorized") || m.includes("authentication")) return "unauthorized";
  if (
    m.includes("forbidden") ||
    m.includes("permission required") ||
    m.includes("permission denied") ||
    m.includes("access denied")
  ) {
    return "forbidden";
  }
  return "error";
}

function throwApiError(msg: string): never {
  const code = classifyApiMessage(msg);
  const friendly =
    code === "forbidden"
      ? "ليس لديك صلاحية لتنفيذ هذا الإجراء"
      : code === "unauthorized"
        ? "انتهت الجلسة أو غير مصرح — يرجى تسجيل الدخول مجدداً"
        : msg;
  const err = new HrApiError(friendly, code);
  if (typeof window !== "undefined" && (code === "forbidden" || code === "unauthorized")) {
    window.dispatchEvent(
      new CustomEvent("hr:api-error", { detail: { code, message: friendly } }),
    );
  }
  throw err;
}

export function isOdooBackend(): boolean {
  return Boolean(BASE_URL);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): HrAuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as HrAuthUser) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(tokens: {
  access_token: string;
  refresh_token?: string;
  user?: HrAuthUser;
}) {
  localStorage.setItem(TOKEN_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  }
  if (tokens.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export interface HrAuthUser {
  id: string;
  email?: string;
  login?: string;
  name?: string;
  odoo_id?: number;
}

async function parseJsonrpc(res: Response) {
  let envelope: any;
  try {
    envelope = await res.json();
  } catch {
    if (res.status === 403) throwApiError("Forbidden");
    if (res.status === 401) throwApiError("Unauthorized");
    throw new HrApiError(`HTTP ${res.status}`, "error");
  }
  if (res.status === 403) throwApiError("Forbidden");
  if (res.status === 401) throwApiError("Unauthorized");
  if (envelope.error) {
    const msg =
      envelope.error?.data?.message ||
      envelope.error?.message ||
      "JSON-RPC error";
    throwApiError(String(msg));
  }
  return envelope.result ?? envelope;
}

export async function odooLogin(username: string, password: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (ODOO_DB) headers["X-Odoo-Database"] = ODOO_DB;

  const res = await fetch(`${BASE_URL}/lugal/auth/login`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { username, password },
      id: Date.now(),
    }),
  });
  const result = await parseJsonrpc(res);
  if (!result?.success && !result?.access_token) {
    throw new Error(result?.error || "Login failed");
  }
  const access = result.access_token || result.data?.access_token;
  const refresh = result.refresh_token || result.data?.refresh_token;
  const rawUser = result.user || result.data?.user || {};
  const user: HrAuthUser = {
    id: String(rawUser.id ?? ""),
    odoo_id: Number(rawUser.id) || undefined,
    email: rawUser.email || rawUser.login || username,
    login: rawUser.login || username,
    name: rawUser.name || username,
  };
  if (!access) throw new Error("No access_token in login response");
  setAuthSession({ access_token: access, refresh_token: refresh, user });
  return { access_token: access, refresh_token: refresh, user };
}

export async function odooLogout() {
  const token = getAccessToken();
  try {
    if (token) {
      await hrCall("/lugal/auth/logout", {});
    }
  } catch {
    /* ignore */
  }
  clearAuthSession();
}

export async function hrCall<T = unknown>(
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  if (!BASE_URL) {
    throw new Error("VITE_API_BASE is not configured");
  }
  const token = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (ODOO_DB) headers["X-Odoo-Database"] = ODOO_DB;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params,
      id: Date.now(),
    }),
  });
  const result = await parseJsonrpc(res);
  if (result && result.success === false) {
    throwApiError(String(result.error || result.message || "HR API error"));
  }
  // Some auth endpoints return tokens at top level
  if (result?.data !== undefined) return result.data as T;
  return result as T;
}

/** CRM effective permissions for the Bearer user (same tree Digi/CRM uses). */
export async function fetchMyPermissions(): Promise<HrPermissionState> {
  const data = await hrCall<Record<string, unknown>>("/api/crm/me/permissions", {});
  if (!data || typeof data !== "object") {
    return emptyPermissionState();
  }
  return {
    permissions: (data.permissions as HrPermissionState["permissions"]) || {},
    routes: (data.routes as Record<string, boolean>) || {},
    role: String(data.role || "none"),
    role_label: String(data.role_label || ""),
    job_title: String(data.job_title || ""),
  };
}
