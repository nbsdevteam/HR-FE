/**
 * Odoo JSON-RPC client for Lugal HR APIs.
 * Enable by setting VITE_API_BASE (and optionally VITE_ODOO_DB).
 */

const API_BASE_CONFIGURED = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");
const ODOO_DB = import.meta.env.VITE_ODOO_DB || "";

// In dev, requests go out relative (same-origin) so they hit the Vite proxy
// (see vite.config.ts) instead of the absolute host directly — that avoids
// an entire class of cross-origin/CORS failures in local development. The
// production build still targets the configured absolute host.
const BASE_URL = import.meta.env.DEV ? "" : API_BASE_CONFIGURED;

const TOKEN_KEY = "lugal_hr_access_token";
const REFRESH_KEY = "lugal_hr_refresh_token";
const USER_KEY = "lugal_hr_user";

export const isOdooBackend = (): boolean => {
  return Boolean(API_BASE_CONFIGURED);
}

export const getAccessToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
}

export const getStoredUser = (): HrAuthUser | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as HrAuthUser) : null;
  } catch {
    return null;
  }
}

export const setAuthSession = (tokens: {
  access_token: string;
  refresh_token?: string;
  user?: HrAuthUser;
}) => {
  localStorage.setItem(TOKEN_KEY, tokens.access_token);
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  }
  if (tokens.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(tokens.user));
  }
}

export const clearAuthSession = () => {
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

export interface HrApiError extends Error {
  code?: string;
  /**
   * The failing response envelope. Typed errors carry extra context alongside
   * `error_code` — e.g. `probation_end_date` on a `probation_block` rejection —
   * which call sites need to build a readable message.
   */
  details?: Record<string, unknown>;
}

async function parseJsonrpc(res: Response) {
  const envelope = await res.json();
  if (envelope.error) {
    const msg =
      envelope.error?.data?.message ||
      envelope.error?.message ||
      "JSON-RPC error";
    throw new Error(msg);
  }
  return envelope.result ?? envelope;
}

export const odooLogin = async (username: string, password: string) => {
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

export const odooLogout = async () => {
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

export const hrCall = async <T = unknown>(
  path: string,
  params: Record<string, unknown> = {},
): Promise<T> => {
  if (!API_BASE_CONFIGURED) {
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
    const error: HrApiError = new Error(result.error || result.message || "HR API error");
    if (result.error_code) error.code = result.error_code;
    error.details = result as Record<string, unknown>;
    throw error;
  }
  // Some auth endpoints return tokens at top level
  if (result?.data !== undefined) return result.data as T;
  return result as T;
}
