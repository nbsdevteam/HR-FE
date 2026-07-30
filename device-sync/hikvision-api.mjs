/**
 * Hikvision ISAPI Client for DS-K1T342MFWX
 * ─────────────────────────────────────────
 * Firmware V3.16.1 — JSON-based ISAPI (not XML)
 * Manual Digest Auth using Node.js built-ins
 */

import https from "node:https";
import http from "node:http";
import crypto from "node:crypto";

// ── Digest Auth HTTP Client ──

class DigestClient {
  constructor(username, password) {
    this.username = username;
    this.password = password;
    this._nc = 0; // nonce counter — increments per authenticated request
  }

  _md5(str) {
    return crypto.createHash("md5").update(str).digest("hex");
  }

  _parseDigestChallenge(header) {
    const params = {};
    // Handle both quoted (including empty "") and unquoted values
    const regex = /(\w+)=(?:"([^"]*)"|([^\s,]+))/g;
    let match;
    while ((match = regex.exec(header)) !== null) {
      // match[2] is the quoted value (can be empty string ""), match[3] is unquoted
      params[match[1]] = match[2] !== undefined ? match[2] : match[3];
    }
    return params;
  }

  _buildDigestHeader(method, uri, challenge) {
    this._nc++;
    const nc = String(this._nc).padStart(8, "0");
    const cnonce = crypto.randomBytes(8).toString("hex");
    const ha1 = this._md5(`${this.username}:${challenge.realm}:${this.password}`);
    const ha2 = this._md5(`${method}:${uri}`);

    let response;
    if (challenge.qop && challenge.qop.includes("auth")) {
      response = this._md5(`${ha1}:${challenge.nonce}:${nc}:${cnonce}:auth:${ha2}`);
    } else {
      response = this._md5(`${ha1}:${challenge.nonce}:${ha2}`);
    }

    let header = `Digest username="${this.username}", realm="${challenge.realm}", nonce="${challenge.nonce}", uri="${uri}", response="${response}"`;
    if (challenge.qop) header += `, qop=auth, nc=${nc}, cnonce="${cnonce}"`;
    // Only include opaque if it has a non-empty value
    if (challenge.opaque) header += `, opaque="${challenge.opaque}"`;
    return header;
  }

  _doRequest(urlStr, opts = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const isHttps = url.protocol === "https:";
      const mod = isHttps ? https : http;

      const reqOpts = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: opts.method || "GET",
        headers: { ...opts.headers },
        rejectUnauthorized: false,
      };

      const req = mod.request(reqOpts, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const rawBuffer = Buffer.concat(chunks);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: rawBuffer.toString("utf-8"),
            rawBuffer,                           // keep raw binary for images
          });
        });
      });

      req.on("error", reject);
      if (opts.body) req.write(opts.body);
      req.end();
    });
  }

  async fetch(method, urlStr, body = null, contentType = "application/json") {
    const headers = {};
    if (contentType) headers["Content-Type"] = contentType;
    if (body) headers["Content-Length"] = Buffer.byteLength(body);

    // First request — expect 401 with digest challenge
    const res1 = await this._doRequest(urlStr, { method, headers, body });

    if (res1.status !== 401) {
      return res1;
    }

    // Parse WWW-Authenticate header
    const authHeader = res1.headers["www-authenticate"];
    if (!authHeader || !authHeader.toLowerCase().startsWith("digest")) {
      throw new Error(`Expected Digest auth challenge, got: ${authHeader}`);
    }

    const challenge = this._parseDigestChallenge(authHeader);
    const url = new URL(urlStr);
    const uri = url.pathname + url.search;
    const digestHeader = this._buildDigestHeader(method, uri, challenge);

    // Retry with digest auth — preserve Content-Type and body
    const authHeaders = { ...headers, Authorization: digestHeader };
    if (body) authHeaders["Content-Length"] = Buffer.byteLength(body);

    const res2 = await this._doRequest(urlStr, { method, headers: authHeaders, body });
    return res2;
  }
}

// ── Hikvision Client ──

export class HikvisionClient {
  constructor({ ip, port = 443, username, password, useHttps = true }) {
    this.baseUrl = `${useHttps ? "https" : "http"}://${ip}:${port}`;
    this.client = new DigestClient(username, password);
    // Capacity cache — invalidated on person create/delete or after TTL
    this._capacityCache = null;
    this._capacityCacheTime = 0;
    this._capacityCacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /** Invalidate capacity cache (call after person create/delete) */
  invalidateCapacityCache() {
    this._capacityCache = null;
    this._capacityCacheTime = 0;
  }

  async _get(path) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${this.baseUrl}${path}${sep}format=json`;
    const res = await this.client.fetch("GET", url, null, null);
    if (res.status >= 400) {
      throw new Error(`ISAPI GET ${path} → ${res.status}: ${res.body.slice(0, 300)}`);
    }
    try { return { json: JSON.parse(res.body), raw: res.body }; }
    catch { return { json: null, raw: res.body }; }
  }

  async _postJson(path, data) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${this.baseUrl}${path}${sep}format=json`;
    const body = JSON.stringify(data);
    const res = await this.client.fetch("POST", url, body, "application/json");
    if (res.status >= 400) {
      throw new Error(`ISAPI POST ${path} → ${res.status}: ${res.body.slice(0, 300)}`);
    }
    try { return JSON.parse(res.body); }
    catch { return res.body; }
  }

  async _putJson(path, data) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${this.baseUrl}${path}${sep}format=json`;
    const body = JSON.stringify(data);
    const res = await this.client.fetch("PUT", url, body, "application/json");
    if (res.status >= 400) {
      throw new Error(`ISAPI PUT ${path} → ${res.status}: ${res.body.slice(0, 300)}`);
    }
    try { return JSON.parse(res.body); }
    catch { return res.body; }
  }

  async _delete(path) {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${this.baseUrl}${path}${sep}format=json`;
    const res = await this.client.fetch("DELETE", url, null, null);
    if (res.status >= 400) {
      throw new Error(`ISAPI DELETE ${path} → ${res.status}: ${res.body.slice(0, 300)}`);
    }
    try { return JSON.parse(res.body); }
    catch { return res.body; }
  }

  // ── Device Info ──

  async getDeviceInfo() {
    const { json, raw } = await this._get("/ISAPI/System/deviceInfo");
    if (json) {
      return {
        model: json.DeviceInfo?.model || json.model || "",
        serialNumber: json.DeviceInfo?.serialNumber || json.serialNumber || "",
        firmwareVersion: json.DeviceInfo?.firmwareVersion || json.firmwareVersion || "",
        deviceName: json.DeviceInfo?.deviceName || json.deviceName || "",
      };
    }
    // XML fallback
    return {
      model: extractXml(raw, "model"),
      serialNumber: extractXml(raw, "serialNumber"),
      firmwareVersion: extractXml(raw, "firmwareVersion"),
      deviceName: extractXml(raw, "deviceName"),
    };
  }

  // ── Access Control Events (attendance punches) ──

  /**
   * Hikvision ISAPI event major codes:
   *   0 = all events
   *   1 = alarm events (door forced, tamper, etc.)
   *   2 = exception events
   *   3 = operation events (door lock/unlock commands)
   *   5 = access control events (authentication — fingerprint/face/card)
   *
   * For attendance we only want major=5 (successful authentication events).
   * Minor codes within major=5:
   *   0x01 (1)  = card auth success
   *   0x4B (75) = face auth success
   *   0x4C (76) = fingerprint auth success
   *   0x04 (4)  = combined auth success
   *   ...and more — but all have an employeeNo if successful
   */

  // Known successful-auth minor codes (major=5)
  static AUTH_SUCCESS_MINORS = new Set([
    1,    // card auth success
    4,    // combined auth success
    21,   // fingerprint + password success
    22,   // fingerprint success
    23,   // fingerprint + card success
    26,   // face success
    29,   // face + fingerprint success
    39,   // face + card success
    75,   // face verify success
    76,   // fingerprint verify success
    77,   // card verify success
    80,   // face + card verify success
    200,  // attendance event (some firmware)
  ]);

  async searchEvents({ startTime, endTime, position = 0, maxResults = 30, major = 5, minor = 0 }) {
    const data = {
      AcsEventCond: {
        searchID: String(Date.now()),
        searchResultPosition: position,
        maxResults: maxResults,
        major: major,
        minor: minor,
        startTime: startTime,
        endTime: endTime,
      },
    };

    const result = await this._postJson("/ISAPI/AccessControl/AcsEvent", data);
    return this._parseEvents(result);
  }

  /** Fetch ALL raw events in a time range (handles pagination) */
  async fetchAllEvents(startTime, endTime, { major = 5, minor = 0 } = {}) {
    const allEvents = [];
    let position = 0;
    const pageSize = 30; // Device max is 30 per capabilities

    while (true) {
      const { events, totalMatches } = await this.searchEvents({
        startTime,
        endTime,
        position,
        maxResults: pageSize,
        major,
        minor,
      });

      allEvents.push(...events);
      position += events.length;

      if (position >= totalMatches || events.length === 0) break;
    }

    return allEvents;
  }

  /**
   * Fetch ONLY successful attendance events (clean check-in/check-out data).
   * Filters: major=5 (access control) + employee must be identified.
   * Deduplicates rapid consecutive punches from the same employee (within 60s).
   */
  async fetchAttendanceEvents(startTime, endTime, { dedupWindowSec = 60 } = {}) {
    const allEvents = await this.fetchAllEvents(startTime, endTime, { major: 5, minor: 0 });

    // Step 1: Filter to only events with a valid employee AND a valid attendanceStatus.
    // The device fires intermediate events (minor=104, 155, 154) when auth succeeds but
    // the user cancels the check-in/check-out prompt. These have no attendanceStatus and
    // must be excluded — otherwise they poison the dedup window and block real events.
    const attendanceEvents = allEvents.filter((evt) => {
      if (!evt.employeeNo || evt.employeeNo === "0" || evt.employeeNo === "") return false;
      if (!evt.attendanceStatus) return false; // no check-in/out direction → not an attendance event
      return true;
    });

    // Step 2: Deduplicate rapid consecutive punches with the SAME status from the same employee.
    // e.g. scanning face twice quickly both as "checkIn" — keep only the first.
    // But checkIn followed by checkOut within 60s (unlikely but possible) must both be kept.
    const lastPunch = {}; // employeeNo → { time: ms, status: string }
    const deduped = attendanceEvents.filter((evt) => {
      const empNo = evt.employeeNo;
      const evtTime = new Date(evt.time).getTime();
      const status = evt.attendanceStatus;

      const prev = lastPunch[empNo];
      if (prev && prev.status === status && (evtTime - prev.time) < dedupWindowSec * 1000) {
        // Same employee, same status, within window — duplicate
        return false;
      }

      lastPunch[empNo] = { time: evtTime, status };
      return true;
    });

    return deduped;
  }

  _parseEvents(result) {
    const info = result.AcsEvent || result;
    const totalMatches = info.totalMatches || 0;
    const list = info.InfoList || [];

    const events = (Array.isArray(list) ? list : [list]).filter(Boolean).map((evt) => ({
      eventId: evt.serialNo || evt.eventId || "",
      employeeNo: evt.employeeNoString || String(evt.employeeNo || ""),
      name: evt.name || "",
      time: evt.time || evt.dateTime || "",
      cardNo: evt.cardNo || "",
      eventType: evt.major,
      eventMinor: evt.minor,
      doorNo: evt.doorNo || 1,
      verifyMode: this._actualVerifyMethod(evt.minor) || this._verifyModeName(evt.currentVerifyMode),
      attendanceStatus: evt.attendanceStatus || null, // "checkIn", "checkOut", "breakOut", "breakIn", etc.
      temperature: evt.currTemperature || null,
      maskStatus: evt.mask || null,
      pictureUrl: evt.pictureURL || null,
    }));

    return { events, totalMatches };
  }

  // Map minor event code to actual method used for this specific event
  _actualVerifyMethod(minor) {
    const methods = {
      1: "بطاقة",           // card auth success
      4: "مركّب",            // combined auth success
      21: "بصمة+رمز",       // fingerprint + password
      22: "بصمة",           // fingerprint success
      23: "بصمة+بطاقة",     // fingerprint + card
      26: "وجه",            // face success
      29: "وجه+بصمة",       // face + fingerprint
      39: "وجه+بطاقة",      // face + card
      75: "وجه",            // face verify success
      76: "بصمة",           // fingerprint verify success
      77: "بطاقة",          // card verify success
      80: "وجه+بطاقة",      // face + card verify
      200: "جهاز",          // generic attendance event
    };
    return methods[minor] || null;
  }

  _verifyModeName(code) {
    const modes = {
      // String modes (V3.16.x firmware returns these)
      "fingerprint": "fingerprint", "face": "face", "card": "card",
      "faceOrFpOrCardOrPw": "وجه", // Multi-mode: any method accepted
      "fpAndCardAndPw": "بصمة+بطاقة",  // Multi-factor: fingerprint AND card AND password
      "cardAndPw": "بطاقة+رمز",
      "fpAndPw": "بصمة+رمز",
      "cardOrFaceOrFp": "وجه",
      "faceOrFp": "وجه",
      "fpOrCard": "بصمة",
      "faceOrCard": "وجه",
      "faceAndFp": "وجه+بصمة",
      "faceAndCard": "وجه+بطاقة",
      "cardAndFp": "بطاقة+بصمة",
      "cardAndFace": "بطاقة+وجه",
      // Numeric modes (older firmware)
      "1": "بصمة", "2": "بطاقة", "4": "وجه",
      "6": "بطاقة+بصمة", "8": "بطاقة+وجه",
      "10": "بصمة+وجه", "14": "بطاقة+بصمة+وجه",
      "20": "بصمة", "21": "بصمة", "22": "وجه",
      "23": "وجه", "24": "بطاقة", "40": "وجه",
      "71": "وجه", "75": "وجه", "76": "بصمة", "80": "وجه",
    };
    return modes[String(code)] || (code ? `mode-${code}` : "غير معروف");
  }

  // ── Enrolled Users ──

  async searchUsers({ position = 0, maxResults = 30 }) {
    const data = {
      UserInfoSearchCond: {
        searchID: String(Date.now()),
        searchResultPosition: position,
        maxResults: maxResults,
      },
    };

    const result = await this._postJson("/ISAPI/AccessControl/UserInfo/Search", data);
    return this._parseUsers(result);
  }

  /** Fetch ALL enrolled users */
  async fetchAllUsers() {
    const allUsers = [];
    let position = 0;
    const pageSize = 30;

    while (true) {
      const { users, totalMatches } = await this.searchUsers({ position, maxResults: pageSize });
      allUsers.push(...users);
      position += users.length;
      if (position >= totalMatches || users.length === 0) break;
    }

    return allUsers;
  }

  _parseUsers(result) {
    const info = result.UserInfoSearch || result;
    const totalMatches = info.totalMatches || 0;
    const list = info.UserInfo || [];

    const users = (Array.isArray(list) ? list : [list]).filter(Boolean).map((u) => ({
      employeeNo: u.employeeNo || "",
      name: u.name || "",
      userType: u.userType || "normal",
      gender: u.gender || null,
      numOfCard: u.numOfCard || 0,
      numOfFP: u.numOfFP || 0,
      numOfFace: u.numOfFace || 0,
    }));

    return { users, totalMatches };
  }

  // ── User count ──

  async getUserCount() {
    const { json, raw } = await this._get("/ISAPI/AccessControl/UserInfo/Count");
    if (json) {
      return json.UserInfoCount?.userNumber || json.userNumber || 0;
    }
    return parseInt(extractXml(raw, "userNumber") || "0");
  }

  // ══════════════════════════════════════════
  // Device Info & Capacity
  // ══════════════════════════════════════════

  async getDeviceInfo() {
    const { json, raw } = await this._get("/ISAPI/System/deviceInfo");
    const info = json?.DeviceInfo || json || {};
    return {
      deviceName: info.deviceName || extractXml(raw, "deviceName") || "",
      model: info.model || extractXml(raw, "model") || "",
      serialNumber: info.serialNo || extractXml(raw, "serialNo") || "",
      firmwareVersion: info.firmwareVersion || extractXml(raw, "firmwareVersion") || "",
      encoderVersion: info.encoderVersion || "",
      webVersion: info.webVersion || "",
      macAddress: info.macAddress || extractXml(raw, "macAddress") || "",
    };
  }

  async getCapacity() {
    // Return cached if fresh
    if (this._capacityCache && (Date.now() - this._capacityCacheTime) < this._capacityCacheTTL) {
      return this._capacityCache;
    }

    // Get real counts from enrolled users
    const users = await this.fetchAllUsers();
    const personCount = users.length;
    let faceCount = 0, fpCount = 0, cardCount = 0;
    for (const u of users) {
      faceCount += u.numOfFace || 0;
      fpCount += u.numOfFP || 0;
      cardCount += u.numOfCard || 0;
    }

    // Try to get event count
    let eventCount = 0;
    try {
      // Search events with a count-only query to get totalMatches
      const result = await this._postJson("/ISAPI/AccessControl/AcsEvent/SearchByPos", {
        AcsEventSearchCond: {
          searchID: String(Date.now()),
          searchResultPosition: 0,
          maxResults: 1,
        },
      });
      eventCount = result?.AcsEvent?.totalMatches || result?.AcsEventInfoSearch?.totalMatches || result?.totalMatches || 0;
    } catch {
      try {
        const { json } = await this._get("/ISAPI/AccessControl/AcsEvent/Count");
        eventCount = json?.AcsEventCount?.eventNumber || json?.eventNumber || 0;
      } catch { /* not supported */ }
    }

    const result = {
      person: { used: personCount, total: 1500 },
      face: { used: faceCount, total: 1500 },
      fingerprint: { used: fpCount, total: 3000 },
      card: { used: cardCount, total: 3000 },
      event: { used: eventCount, total: 150000 },
    };

    // Cache the result
    this._capacityCache = result;
    this._capacityCacheTime = Date.now();

    return result;
  }

  async getNetworkStatus() {
    try {
      const { json } = await this._get("/ISAPI/System/Network/interfaces/1");
      const iface = json?.NetworkInterface || json || {};
      return {
        ipAddress: iface.IPAddress?.ipAddress || "",
        subnetMask: iface.IPAddress?.subnetMask || "",
        gateway: iface.IPAddress?.defaultGateway || "",
        macAddress: iface.macAddress || "",
      };
    } catch {
      return { ipAddress: "", subnetMask: "", gateway: "", macAddress: "" };
    }
  }

  async getDoorStatus() {
    try {
      const { json } = await this._get("/ISAPI/AccessControl/Door/param/1");
      const door = json?.DoorParam || json || {};
      return {
        doorName: door.doorName || "Door1",
        openDuration: door.openDuration || 0,
        magneticType: door.magneticType || "",
      };
    } catch {
      return { doorName: "Door1", openDuration: 0, magneticType: "" };
    }
  }

  // ══════════════════════════════════════════
  // Person Management (CRUD)
  // ══════════════════════════════════════════

  /** Create a new person on the device */
  async createPerson({ employeeNo, name, gender = "male", userType = "normal", validFrom, validTo }) {
    const userInfo = {
      employeeNo: String(employeeNo),
      name: name || "",
      userType: userType, // "normal", "visitor", "blackList"
      gender: gender, // "male", "female", "unknown"
      Valid: {
        enable: true,
        beginTime: validFrom || "2024-01-01T00:00:00",
        endTime: validTo || "2034-12-31T23:59:59",
        timeType: "local",
      },
    };

    const result = await this._postJson("/ISAPI/AccessControl/UserInfo/Record", {
      UserInfo: userInfo,
    });
    this.invalidateCapacityCache();
    return result;
  }

  /** Update an existing person on the device */
  async updatePerson({ employeeNo, name, gender, userType, validFrom, validTo }) {
    const userInfo = { employeeNo: String(employeeNo) };
    if (name !== undefined) userInfo.name = name;
    if (gender !== undefined) userInfo.gender = gender;
    if (userType !== undefined) userInfo.userType = userType;
    if (validFrom || validTo) {
      userInfo.Valid = {
        enable: true,
        beginTime: validFrom || "2024-01-01T00:00:00",
        endTime: validTo || "2034-12-31T23:59:59",
        timeType: "local",
      };
    }

    const result = await this._putJson("/ISAPI/AccessControl/UserInfo/Modify", {
      UserInfo: userInfo,
    });
    return result;
  }

  /** Delete a person from the device */
  async deletePerson(employeeNo) {
    const result = await this._putJson("/ISAPI/AccessControl/UserInfo/Delete", {
      UserInfoDelCond: {
        EmployeeNoList: [{ employeeNo: String(employeeNo) }],
      },
    });
    this.invalidateCapacityCache();
    return result;
  }

  /** Get a single person's info */
  async getPerson(employeeNo) {
    const result = await this._postJson("/ISAPI/AccessControl/UserInfo/Search", {
      UserInfoSearchCond: {
        searchID: String(Date.now()),
        searchResultPosition: 0,
        maxResults: 1,
        EmployeeNoList: [{ employeeNo: String(employeeNo) }],
      },
    });
    const info = result.UserInfoSearch || result;
    const list = info.UserInfo || [];
    const users = (Array.isArray(list) ? list : [list]).filter(Boolean);
    return users[0] || null;
  }

  // ══════════════════════════════════════════
  // Face Photo Management
  // ══════════════════════════════════════════

  /** Upload a face photo for a person (base64 JPEG/PNG) */
  async uploadFacePhoto(employeeNo, imageBuffer) {
    const url = `${this.baseUrl}/ISAPI/Intelligent/FDLib/FDSetUp?format=json`;
    const boundary = `----HikBoundary${Date.now()}`;

    // Build multipart body
    const jsonPart = JSON.stringify({
      faceLibType: "blackFD",
      FDID: "1",
      FPID: String(employeeNo),
    });

    const parts = [];
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="FaceDataRecord"\r\n`);
    parts.push(`Content-Type: application/json\r\n\r\n`);
    parts.push(`${jsonPart}\r\n`);
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="FaceImage"; filename="face.jpg"\r\n`);
    parts.push(`Content-Type: image/jpeg\r\n\r\n`);

    const header = Buffer.from(parts.join(""));
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, imageBuffer, footer]);

    const res = await this.client.fetch("POST", url, body, `multipart/form-data; boundary=${boundary}`);
    if (res.status >= 400) throw new Error(`Face upload failed: ${res.status} — ${res.body.slice(0, 300)}`);
    try { return JSON.parse(res.body); } catch { return res.body; }
  }

  /** Get face photo for a person (returns Buffer) */
  async getFacePhoto(employeeNo) {
    try {
      const result = await this._postJson("/ISAPI/Intelligent/FDLib/FDSearch", {
        searchResultPosition: 0,
        maxResults: 1,
        faceLibType: "blackFD",
        FDID: "1",
        FPID: String(employeeNo),
      });
      const matchList = result.MatchList || [];
      const match = Array.isArray(matchList) ? matchList[0] : matchList;
      if (match?.faceURL) {
        // Fetch the actual image — use rawBuffer to avoid UTF-8 corruption of binary JPEG
        const imgUrl = match.faceURL.startsWith("http") ? match.faceURL : `${this.baseUrl}${match.faceURL}`;
        const res = await this.client.fetch("GET", imgUrl, null, null);
        if (res.status === 200 && res.rawBuffer && res.rawBuffer.length > 100) {
          return { found: true, imageBase64: res.rawBuffer.toString("base64") };
        }
      }
      return { found: false, imageBase64: null };
    } catch {
      return { found: false, imageBase64: null };
    }
  }

  /** Delete face data for a person */
  async deleteFacePhoto(employeeNo) {
    try {
      const result = await this._putJson("/ISAPI/Intelligent/FDLib/FDSearch/Delete", {
        FPID: [{ value: String(employeeNo) }],
        faceLibType: "blackFD",
        FDID: "1",
      });
      return result;
    } catch (e) {
      return { error: e.message };
    }
  }

  // ══════════════════════════════════════════
  // Door Control
  // ══════════════════════════════════════════

  async remoteDoorOpen(doorNo = 1) {
    return this._putJson("/ISAPI/AccessControl/RemoteControl/door/1", {
      RemoteControlDoor: { cmd: "open" },
    });
  }

  async remoteDoorClose(doorNo = 1) {
    return this._putJson("/ISAPI/AccessControl/RemoteControl/door/1", {
      RemoteControlDoor: { cmd: "close" },
    });
  }

  // ── Raw request (for debugging) ──

  async rawGet(path) {
    const url = `${this.baseUrl}${path}`;
    const res = await this.client.fetch("GET", url, null, null);
    return { status: res.status, body: res.body };
  }

  async rawPostJson(path, data) {
    const url = `${this.baseUrl}${path}`;
    const body = JSON.stringify(data);
    const res = await this.client.fetch("POST", url, body, "application/json");
    return { status: res.status, body: res.body };
  }

  async rawPostXml(path, xml) {
    const url = `${this.baseUrl}${path}`;
    const res = await this.client.fetch("POST", url, xml, "application/xml");
    return { status: res.status, body: res.body };
  }
}

// ── Helper: extract value from XML tag ──
function extractXml(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return m ? m[1].trim() : "";
}
