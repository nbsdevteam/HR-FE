/**
 * Debug: try all possible format combinations now that auth is fixed
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

async function authPost(path, contentType, body) {
  const hdrs = {};
  if (contentType) hdrs["Content-Type"] = contentType;
  if (body) hdrs["Content-Length"] = String(Buffer.byteLength(body));

  // Step 1: get challenge
  const r1 = await doRequest("POST", path, hdrs, body);
  if (r1.status !== 401) return r1;

  const challenge = parseDigest(r1.headers["www-authenticate"]);
  const auth = makeAuth("POST", path, challenge);
  const hdrs2 = { ...hdrs, Authorization: auth };

  // Step 2: authenticated
  return doRequest("POST", path, hdrs2, body);
}

async function test(label, path, contentType, body) {
  try {
    const res = await authPost(path, contentType, body);
    const ok = res.status === 200;
    const preview = res.body.slice(0, 200);
    console.log(`${ok ? "✅" : "❌"} [${res.status}] ${label}`);
    if (ok) console.log(`   ${preview}\n`);
    else console.log(`   ${preview.replace(/\n/g, " ").slice(0, 120)}\n`);
  } catch (err) {
    console.log(`❌ ${label}: ${err.message}\n`);
  }
}

async function main() {
  console.log("Hikvision POST Format Debug (auth fixed)\n");

  const jsonBody = JSON.stringify({
    AcsEventCond: {
      searchID: "1", searchResultPosition: 0, maxResults: 10,
      major: 0, minor: 0,
      startTime: `${today}T00:00:00+03:00`, endTime: `${today}T23:59:59+03:00`,
    },
  });

  const xmlBody = `<?xml version="1.0" encoding="UTF-8"?><AcsEventCond><searchID>1</searchID><searchResultPosition>0</searchResultPosition><maxResults>10</maxResults><major>0</major><minor>0</minor><startTime>${today}T00:00:00+03:00</startTime><endTime>${today}T23:59:59+03:00</endTime></AcsEventCond>`;

  // AcsEvent tests — try ?format=json on URL
  await test("AcsEvent: JSON body, json CT, ?format=json",
    "/ISAPI/AccessControl/AcsEvent?format=json", "application/json", jsonBody);

  await test("AcsEvent: JSON body, json CT, no query",
    "/ISAPI/AccessControl/AcsEvent", "application/json", jsonBody);

  await test("AcsEvent: XML body, xml CT, no query",
    "/ISAPI/AccessControl/AcsEvent", "application/xml", xmlBody);

  await test("AcsEvent: XML body, xml CT, ?format=json",
    "/ISAPI/AccessControl/AcsEvent?format=json", "application/xml", xmlBody);

  await test("AcsEvent: JSON body, xml CT, ?format=json",
    "/ISAPI/AccessControl/AcsEvent?format=json", "application/xml", jsonBody);

  // UserInfo tests
  const userJson = JSON.stringify({
    UserInfoSearchCond: {
      searchID: "1", searchResultPosition: 0, maxResults: 10,
    },
  });

  const userXml = `<?xml version="1.0" encoding="UTF-8"?><UserInfoSearchCond><searchID>1</searchID><searchResultPosition>0</searchResultPosition><maxResults>10</maxResults></UserInfoSearchCond>`;

  await test("UserInfo: JSON body, json CT, ?format=json",
    "/ISAPI/AccessControl/UserInfo/Search?format=json", "application/json", userJson);

  await test("UserInfo: JSON body, json CT, no query",
    "/ISAPI/AccessControl/UserInfo/Search", "application/json", userJson);

  await test("UserInfo: XML body, xml CT, no query",
    "/ISAPI/AccessControl/UserInfo/Search", "application/xml", userXml);

  await test("UserInfo: XML body, xml CT, ?format=json",
    "/ISAPI/AccessControl/UserInfo/Search?format=json", "application/xml", userXml);

  console.log("Done! Look for ✅ above.");
}

main().catch(console.error);
