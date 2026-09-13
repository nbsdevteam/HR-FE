/**
 * Hikvision terminal addresses — LAN first, Wi-Fi fallback.
 * ─────────────────────────────────────────
 * The DS-K1T342MFWX answers on two interfaces, both configured in .env:
 *   DEVICE_LAN_IP   wired interface — used whenever it answers
 *   DEVICE_WIFI_IP  wireless interface — used only while LAN does not answer
 * DEVICE_IP is still read as a legacy alias for DEVICE_LAN_IP, so an existing
 * .env keeps working unchanged.
 *
 * The LAN address is the device's *identity* — the value stored in Odoo
 * lugal.hr.biometric.device.ip_address and Supabase biometric_devices.ip_address.
 * The *active* address follows the network; the identity never does. Keying a
 * row on the active address registers a second device the first time the
 * service fails over.
 */

import net from "node:net";

export const DEFAULT_CONNECT_TIMEOUT_MS = 3000;

// Errors that mean "this address did not answer", as opposed to an ISAPI error
// returned by a device that did answer.
const NETWORK_ERROR_CODES = new Set([
  "ECONNREFUSED", "EHOSTUNREACH", "ENETUNREACH", "EHOSTDOWN", "ETIMEDOUT", "ECONNRESET", "EPIPE",
]);

export function isNetworkError(err) {
  return Boolean(err && NETWORK_ERROR_CODES.has(err.code));
}

/** Configured addresses in preference order: [{ network: "lan", ip }, { network: "wifi", ip }]. */
export function resolveDeviceAddresses(env = process.env) {
  const lan = (env.DEVICE_LAN_IP || env.DEVICE_IP || "").trim();
  const wifi = (env.DEVICE_WIFI_IP || "").trim();
  if (!lan && !wifi) {
    throw new Error("No device address configured — set DEVICE_LAN_IP and DEVICE_WIFI_IP in .env");
  }
  const addresses = [];
  if (lan) addresses.push({ network: "lan", ip: lan });
  if (wifi && wifi !== lan) addresses.push({ network: "wifi", ip: wifi });
  return addresses;
}

/** Resolves true when a TCP connection to ip:port opens within timeoutMs. */
export function probeTcp(ip, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: ip, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
  });
}

export class DeviceAddressSelector {
  constructor(addresses, { port, connectTimeoutMs = DEFAULT_CONNECT_TIMEOUT_MS, probe = probeTcp, log = () => {} } = {}) {
    if (!addresses?.length) throw new Error("DeviceAddressSelector needs at least one address");
    this.addresses = addresses;
    this.port = port;
    this.connectTimeoutMs = connectTimeoutMs;
    this.probe = probe;
    this.log = log;
    this.activeIndex = 0;
  }

  get active() {
    return this.addresses[this.activeIndex];
  }

  /** The address that names this device in Odoo / Supabase — always the first configured (LAN). */
  get identityIp() {
    return this.addresses[0].ip;
  }

  get allIps() {
    return this.addresses.map((a) => a.ip);
  }

  describe() {
    return this.addresses.map((a) => `${a.network}=${a.ip}`).join(", ");
  }

  /**
   * Probe in preference order and make the first address that accepts a TCP
   * connection active. Called at startup, on every health check — which is what
   * moves the service back to LAN once LAN recovers — and after a request fails
   * at the network level. Throws when no address answers; the active address is
   * then left as it was.
   *
   * Concurrent callers share one probe round: /api/device/info fires four ISAPI
   * calls at once, and all four fail together when an interface drops.
   */
  select() {
    if (!this._inflight) {
      this._inflight = this._probeInOrder().finally(() => {
        this._inflight = null;
      });
    }
    return this._inflight;
  }

  async _probeInOrder() {
    for (let i = 0; i < this.addresses.length; i++) {
      const candidate = this.addresses[i];
      if (await this.probe(candidate.ip, this.port, this.connectTimeoutMs)) {
        if (i !== this.activeIndex) {
          const from = this.active;
          this.activeIndex = i;
          this.log("🔀", `Device address switched ${from.network} (${from.ip}) → ${candidate.network} (${candidate.ip})`);
        }
        return candidate;
      }
    }
    throw new Error(`Device unreachable on every configured address (${this.describe()})`);
  }
}
