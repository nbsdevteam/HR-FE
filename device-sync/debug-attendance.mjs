/**
 * Explore attendance-specific endpoints and event filtering
 */

import "dotenv/config";
import https from "node:https";
import crypto from "node:crypto";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const IP = process.env.DEVICE_IP || "192.168.15.15";
const PORT = parseInt(process.env.DEVICE_PORT || "443");
const USER = process.env.DEVICE_USERNAME || "admin";
const PASS = process.env.DEVICE_PASSWORD || "";
const today = new Date().toISOString().slice(0, 10);

function md5(str) { return crypto.createHash("md5").update(str).digest("hex"); }

function doRequest(method, path, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: IP, port: PORT, path, method, headers, rejectUnauthorized: false };
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf-8") }));
    });
    req.on("error", reject);
    if (body) req.write(body, "utf-8");
    req.end();
  });
}

function parseDigest(header) {
  const params = {};
  const regex = /(\w+)=(?:"([^"]*)"|([^\s,]+))/g;
  let m;
  while ((m = regex.exec(header)) !== null) params[m[1]] = m[2] !== undefined ? m[2] : m[3];
  return params;
}

function makeAuth(method, uri, challenge) {
  const nc = "00000001";
  const cnonce = crypto.randomBytes(8).toString("hex");
  const ha1 = md5(`${USER}:${challenge.realm}:${PASS}`);
  const ha2 = md5(`${method}:${uri}`);
  const resp = challenge.qop
    ? md5(`${ha1}:${challenge.nonce}:${nc}:${cnonce}:auth:${ha2}`)
    : md5(`${ha1}:${challenge.nonce}:${ha2}`);
  let h = `Digest username="${USER}", realm="${challenge.realm}", nonce="${challenge.nonce}", uri="${uri}", response="${resp}"`;
  if (challenge.qop) h += `, qop=auth, nc=${nc}, cnonce="${cnonce}"`;
  if (challenge.opaque) h += `, opaque="${challenge.opaque}"`;
  return h;
}

async function authRequest(method, path, contentType, body) {
  const hdrs = {};
  if (contentType) hdrs["Content-Type"] = contentType;
  if (body) hdrs["Content-Length"] = String(Buffer.byteLength(body));
  const r1 = await doRequest(method, path, hdrs, body);
  if (r1.status !== 401) return r1;
  const challenge = parseDigest(r1.headers["www-authenticate"]);
  const auth = makeAuth(method, path, challenge);
  return doRequest(method, path, { ...hdrs, Authorization: auth }, body);
}

async function get(path) {
  const res = await authRequest("GET", path, null, null);
  return { status: res.status, body: res.body };
}

async function postJson(path, data) {
  const body = JSON.stringify(data);
  const res = await authRequest("POST", path + (path.includes("?") ? "&" : "?") + "format=json", "application/json", body);
  return { status: res.status, data: res.status === 200 ? JSON.parse(res.body) : res.body };
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Attendance Endpoint & Event Type Explorer");
  console.log("═══════════════════════════════════════════\n");

  // ── Part 1: Check for dedicated attendance endpoints ──
  console.log("── Part 1: Checking attendance-specific endpoints ──\n");

  const endpoints = [
    "/ISAPI/AccessControl/AttendanceRecord/capabilities?format=json",
    "/ISAPI/AccessControl/AttendanceRecord?format=json",
    "/ISAPI/AccessControl/ShiftWeekPlanCfg?format=json",
    "/ISAPI/AccessControl/AttendanceStatusCfg?format=json",
    "/ISAPI/AccessControl/AttendanceStatusModeCfg?format=json",
    "/ISAPI/AccessControl/EventCardLinkageCfg/capabilities?format=json",
    "/ISAPI/AccessControl/AcsEvent/capabilities?format=json",
  ];

  for (const ep of endpoints) {
    const res = await get(ep);
    const label = res.status === 200 ? "✅" : "❌";
    console.log(`${label} [${res.status}] ${ep}`);
    if (res.status === 200) {
      console.log(`   ${res.body.slice(0, 300)}\n`);
    }
  }

  // ── Part 2: Analyze event major/minor codes ──
  console.log("\n── Part 2: Analyzing event types from today's data ──\n");

  const result = await postJson("/ISAPI/AccessControl/AcsEvent", {
    AcsEventCond: {
      searchID: "1",
      searchResultPosition: 0,
      maxResults: 30,
      major: 0,  // 0 = all events
      minor: 0,
      startTime: `${today}T00:00:00+03:00`,
      endTime: `${today}T23:59:59+03:00`,
    },
  });

  if (result.status !== 200) {
    console.log("Failed to fetch events:", result.data);
    return;
  }

  const events = result.data.AcsEvent?.InfoList || [];
  console.log(`Total events in sample: ${events.length}\n`);

  // Group by major+minor
  const typeMap = {};
  for (const evt of events) {
    const key = `major=${evt.major}, minor=${evt.minor}`;
    if (!typeMap[key]) typeMap[key] = { count: 0, hasEmployee: 0, sample: null };
    typeMap[key].count++;
    if (evt.employeeNoString || evt.name) typeMap[key].hasEmployee++;
    if (!typeMap[key].sample) typeMap[key].sample = evt;
  }

  console.log("Event type breakdown:");
  for (const [key, val] of Object.entries(typeMap)) {
    console.log(`\n  ${key} — ${val.count} events (${val.hasEmployee} with employee)`);
    const s = val.sample;
    console.log(`    Sample: time=${s.time}, emp=${s.employeeNoString || "—"}, name=${s.name || "—"}`);
    console.log(`    Fields: ${Object.keys(s).join(", ")}`);
  }

  // ── Part 3: Try filtering by major=5 only (access events with auth) ──
  console.log("\n\n── Part 3: Fetch only major=5 (access events) ──\n");

  const filtered = await postJson("/ISAPI/AccessControl/AcsEvent", {
    AcsEventCond: {
      searchID: "2",
      searchResultPosition: 0,
      maxResults: 30,
      major: 5,
      minor: 0,
      startTime: `${today}T00:00:00+03:00`,
      endTime: `${today}T23:59:59+03:00`,
    },
  });

  if (filtered.status === 200) {
    const fevts = filtered.data.AcsEvent?.InfoList || [];
    console.log(`major=5 events: ${filtered.data.AcsEvent?.totalMatches || fevts.length} total\n`);

    const minorMap = {};
    for (const evt of fevts) {
      const key = `minor=${evt.minor}`;
      if (!minorMap[key]) minorMap[key] = { count: 0, hasEmp: 0, sample: null };
      minorMap[key].count++;
      if (evt.employeeNoString) minorMap[key].hasEmp++;
      if (!minorMap[key].sample) minorMap[key].sample = evt;
    }

    for (const [key, val] of Object.entries(minorMap)) {
      const s = val.sample;
      console.log(`  ${key} — ${val.count} events (${val.hasEmp} with employee)`);
      console.log(`    Sample: ${s.time} | emp=${s.employeeNoString || "—"} | ${s.name || "—"} | type=${s.currentVerifyMode || "—"}`);
    }
  } else {
    console.log("  Failed:", typeof filtered.data === "string" ? filtered.data.slice(0, 200) : "error");
  }

  // ── Part 4: Try major=1 (alarm/failed events) ──
  console.log("\n\n── Part 4: Fetch major=1 events (alarms) ──\n");

  const alarms = await postJson("/ISAPI/AccessControl/AcsEvent", {
    AcsEventCond: {
      searchID: "3",
      searchResultPosition: 0,
      maxResults: 10,
      major: 1,
      minor: 0,
      startTime: `${today}T00:00:00+03:00`,
      endTime: `${today}T23:59:59+03:00`,
    },
  });

  if (alarms.status === 200) {
    const aevts = alarms.data.AcsEvent?.InfoList || [];
    console.log(`major=1 events: ${alarms.data.AcsEvent?.totalMatches || aevts.length}`);
    for (const evt of aevts.slice(0, 5)) {
      console.log(`  minor=${evt.minor} | ${evt.time} | emp=${evt.employeeNoString || "—"} | ${evt.name || "—"}`);
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  Done! Check which events are the clean attendance ones");
  console.log("═══════════════════════════════════════════\n");
}

main().catch(console.error);
