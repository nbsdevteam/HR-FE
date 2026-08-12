/**
 * Odoo JSON-RPC client for the device-sync bridge (BACKEND=odoo).
 *
 * Mirrors the JWT auth flow already used by the SPA
 * (../src/app/lib/api/client.ts — /lugal/auth/login|refresh via lugal_auth)
 * but:
 *   - logs in with a dedicated service account (see
 *     Lugal-ai/scripts/hr_migration/setup_device_sync_service_account.py)
 *     instead of an interactive user,
 *   - keeps tokens in memory (no localStorage — this runs headless in Node),
 *   - auto-refreshes/re-logs-in transparently on 401 so long-running cron
 *     jobs never need to think about token lifetime.
 */

export class OdooClient {
  constructor({ apiBase, db, username, password, log } = {}) {
    if (!apiBase) throw new Error("OdooClient: apiBase is required");
    if (!username || !password) {
      throw new Error("OdooClient: username and password are required");
    }
    this.apiBase = apiBase.replace(/\/$/, "");
    this.db = db || "";
    this.username = username;
    this.password = password;
    this.log = log || (() => {});

    this.accessToken = null;
    this.refreshToken = null;
    this._loginPromise = null; // dedupe concurrent logins
  }

  _headers(withAuth) {
    const headers = { "Content-Type": "application/json" };
    if (this.db) headers["X-Odoo-Database"] = this.db;
    if (withAuth && this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;
    return headers;
  }

  async _post(path, params, withAuth) {
    const res = await fetch(`${this.apiBase}${path}`, {
      method: "POST",
      headers: this._headers(withAuth),
      body: JSON.stringify({ jsonrpc: "2.0", method: "call", params: params || {}, id: Date.now() }),
    });
    let envelope;
    try {
      envelope = await res.json();
    } catch (err) {
      throw new Error(`Odoo RPC ${path}: invalid JSON response (HTTP ${res.status})`);
    }
    if (envelope.error) {
      const msg = envelope.error?.data?.message || envelope.error?.message || "JSON-RPC error";
      const err = new Error(`Odoo RPC ${path}: ${msg}`);
      err.httpStatus = res.status;
      err.rpcError = envelope.error;
      throw err;
    }
    const result = envelope.result ?? envelope;
    return { httpStatus: res.status, result };
  }

  /** Authenticate the service account and cache tokens. Safe to call repeatedly (deduped). */
  async login() {
    if (this._loginPromise) return this._loginPromise;
    this._loginPromise = (async () => {
      const { result } = await this._post(
        "/lugal/auth/login",
        { username: this.username, password: this.password, remember_me: true },
        false,
      );
      const data = result?.data ?? result;
      if (!result?.success || !data?.access_token) {
        throw new Error(`Odoo login failed for ${this.username}: ${result?.error || "no access_token in response"}`);
      }
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token || this.refreshToken;
      this.log(`🔐 Odoo login OK (${this.username}@${this.db || "default db"})`);
      return data;
    })();
    try {
      return await this._loginPromise;
    } finally {
      this._loginPromise = null;
    }
  }

  async _refresh() {
    if (!this.refreshToken) return false;
    try {
      const { result } = await this._post("/lugal/auth/refresh", { refresh_token: this.refreshToken }, false);
      const data = result?.data ?? result;
      if (!result?.success || !data?.access_token) return false;
      this.accessToken = data.access_token;
      return true;
    } catch (err) {
      this.log(`⚠️ Odoo token refresh failed: ${err.message}`);
      return false;
    }
  }

  /**
   * Authenticated JSON-RPC call to a lugal_hr/lugal_auth endpoint.
   * Transparently logs in on first use and retries once after a
   * refresh/re-login if the server reports 401/Unauthorized.
   */
  async call(path, params = {}) {
    if (!this.accessToken) await this.login();

    const attempt = async () => this._post(path, params, true);

    let { httpStatus, result } = await attempt();
    if (httpStatus === 401 || result?.error === "Unauthorized") {
      const refreshed = await this._refresh();
      if (!refreshed) await this.login();
      ({ httpStatus, result } = await attempt());
    }

    if (result && result.success === false) {
      const err = new Error(result.error || result.message || `Odoo API error calling ${path}`);
      err.odooResult = result;
      throw err;
    }
    return result?.data !== undefined ? result.data : result;
  }
}
