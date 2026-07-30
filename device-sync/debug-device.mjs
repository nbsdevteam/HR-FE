/**
 * Debug: try multiple XML formats to find what the device accepts
 * Run: node debug-device.mjs
 */

import "dotenv/config";
import { HikvisionClient } from "./hikvision-api.mjs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const hik = new HikvisionClient({
  ip: process.env.DEVICE_IP || "192.168.15.15",
  port: parseInt(process.env.DEVICE_PORT || "443"),
  username: process.env.DEVICE_USERNAME || "admin",
  password: process.env.DEVICE_PASSWORD || "",
  useHttps: process.env.DEVICE_USE_HTTPS !== "false",
});

const today = new Date().toISOString().slice(0, 10);

// Different XML body formats to try for AcsEvent
const eventFormats = [
  {
    label: "Format 1: No namespace, no version, no XML declaration",
    body: `<AcsEventCond>
<searchID>1</searchID>
<searchResultPosition>0</searchResultPosition>
<maxResults>10</maxResults>
<major>0</major>
<minor>0</minor>
<startTime>${today}T00:00:00+03:00</startTime>
<endTime>${today}T23:59:59+03:00</endTime>
</AcsEventCond>`,
  },
  {
    label: "Format 2: Hikvision v1.0 namespace",
    body: `<?xml version="1.0" encoding="UTF-8"?>
<AcsEventCond version="1.0" xmlns="http://www.hikvision.com/ver10/XMLSchema">
<searchID>1</searchID>
<searchResultPosition>0</searchResultPosition>
<maxResults>10</maxResults>
<major>0</major>
<minor>0</minor>
<startTime>${today}T00:00:00+03:00</startTime>
<endTime>${today}T23:59:59+03:00</endTime>
</AcsEventCond>`,
  },
  {
    label: "Format 3: ISAPI v2.0 namespace",
    body: `<?xml version="1.0" encoding="UTF-8"?>
<AcsEventCond version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
<searchID>1</searchID>
<searchResultPosition>0</searchResultPosition>
<maxResults>10</maxResults>
<major>0</major>
<minor>0</minor>
<startTime>${today}T00:00:00+03:00</startTime>
<endTime>${today}T23:59:59+03:00</endTime>
</AcsEventCond>`,
  },
  {
    label: "Format 4: Minimal — just required fields",
    body: `<AcsEventCond>
<searchID>1</searchID>
<searchResultPosition>0</searchResultPosition>
<maxResults>10</maxResults>
<startTime>${today}T00:00:00+03:00</startTime>
<endTime>${today}T23:59:59+03:00</endTime>
</AcsEventCond>`,
  },
  {
    label: "Format 5: AcsEventSearchDescription tag name",
    body: `<AcsEventSearchDescription>
<searchID>1</searchID>
<searchResultPosition>0</searchResultPosition>
<maxResults>10</maxResults>
<AcsEventFilter>
<major>0</major>
<minor>0</minor>
<startTime>${today}T00:00:00+03:00</startTime>
<endTime>${today}T23:59:59+03:00</endTime>
</AcsEventFilter>
</AcsEventSearchDescription>`,
  },
];

// Different user search formats
const userFormats = [
  {
    label: "UserInfo Format 1: No namespace",
    body: `<UserInfoSearchCond>
<searchID>1</searchID>
<searchResultPosition>0</searchResultPosition>
<maxResults>10</maxResults>
</UserInfoSearchCond>`,
  },
  {
    label: "UserInfo Format 2: Hikvision v1.0",
    body: `<?xml version="1.0" encoding="UTF-8"?>
<UserInfoSearchCond version="1.0" xmlns="http://www.hikvision.com/ver10/XMLSchema">
<searchID>1</searchID>
<searchResultPosition>0</searchResultPosition>
<maxResults>10</maxResults>
</UserInfoSearchCond>`,
  },
];

async function tryFormats() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Hikvision ISAPI Format Debug Tool");
  console.log("═══════════════════════════════════════════════\n");

  // First: discover what capabilities the device exposes
  console.log("── Checking device capabilities ──\n");

  const capPaths = [
    "/ISAPI/AccessControl/AcsEvent/capabilities",
    "/ISAPI/AccessControl/AcsEvent/capabilities?format=json",
    "/ISAPI/AccessControl/UserInfo/capabilities",
    "/ISAPI/AccessControl/capabilities",
    "/ISAPI/Event/notification/httpHosts",
    "/ISAPI/AccessControl/AcsEventTotalNum",
  ];

  for (const path of capPaths) {
    try {
      const res = await hik.rawRequest("GET", path);
      console.log(`GET ${path}`);
      console.log(`  → ${res.status}: ${res.body.slice(0, 250)}`);
      console.log();
    } catch (err) {
      console.log(`GET ${path}`);
      console.log(`  → Error: ${err.message.slice(0, 150)}`);
      console.log();
    }
  }

  // Try event search formats
  console.log("\n── Testing AcsEvent POST formats ──\n");

  for (const fmt of eventFormats) {
    try {
      const res = await hik.rawRequest("POST", "/ISAPI/AccessControl/AcsEvent", fmt.body);
      const preview = res.body.slice(0, 250);
      const isError = preview.includes("statusCode>5<") || preview.includes("Invalid");
      console.log(`${isError ? "❌" : "✅"} ${fmt.label}`);
      console.log(`  → ${res.status}: ${preview}`);
    } catch (err) {
      console.log(`❌ ${fmt.label}`);
      console.log(`  → Error: ${err.message.slice(0, 150)}`);
    }
    console.log();
  }

  // Try user search formats
  console.log("\n── Testing UserInfo POST formats ──\n");

  for (const fmt of userFormats) {
    try {
      const res = await hik.rawRequest("POST", "/ISAPI/AccessControl/UserInfo/Search", fmt.body);
      const preview = res.body.slice(0, 250);
      const isError = preview.includes("statusCode>5<") || preview.includes("Invalid");
      console.log(`${isError ? "❌" : "✅"} ${fmt.label}`);
      console.log(`  → ${res.status}: ${preview}`);
    } catch (err) {
      console.log(`❌ ${fmt.label}`);
      console.log(`  → Error: ${err.message.slice(0, 150)}`);
    }
    console.log();
  }

  // Try JSON body instead of XML
  console.log("\n── Testing JSON body format ──\n");

  const jsonBody = JSON.stringify({
    AcsEventCond: {
      searchID: "1",
      searchResultPosition: 0,
      maxResults: 10,
      major: 0,
      minor: 0,
      startTime: `${today}T00:00:00+03:00`,
      endTime: `${today}T23:59:59+03:00`,
    },
  });

  try {
    const res = await hik.rawRequest("POST", "/ISAPI/AccessControl/AcsEvent", jsonBody);
    console.log(`POST /AcsEvent with JSON body (Content-Type: application/xml)`);
    console.log(`  → ${res.status}: ${res.body.slice(0, 250)}`);
  } catch (err) {
    console.log(`  → Error: ${err.message.slice(0, 150)}`);
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("  Debug complete — check which format got ✅");
  console.log("═══════════════════════════════════════════════\n");
}

tryFormats().catch((err) => {
  console.error("Fatal:", err.message);
});
