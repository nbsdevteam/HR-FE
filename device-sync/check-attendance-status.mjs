/**
 * Quick probe: Does the device send attendanceStatus in events?
 * And does it support attendance mode configuration?
 *
 * Usage: node check-attendance-status.mjs
 */

import "dotenv/config";
import { HikvisionClient } from "./hikvision-api.mjs";

const hik = new HikvisionClient({
  ip: process.env.DEVICE_IP || "192.168.15.15",
  port: parseInt(process.env.DEVICE_PORT || "443"),
  username: process.env.DEVICE_USERNAME || "admin",
  password: process.env.DEVICE_PASSWORD || "",
  useHttps: process.env.DEVICE_USE_HTTPS !== "false",
});

const today = new Date().toISOString().slice(0, 10);

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Checking: Does the device provide attendanceStatus?");
  console.log("═══════════════════════════════════════════════════════\n");

  // ── 1. Check attendance configuration endpoints ──
  console.log("── 1. Attendance configuration endpoints ──\n");

  const configEndpoints = [
    "/ISAPI/AccessControl/AttendanceStatusCfg",
    "/ISAPI/AccessControl/AttendanceStatusModeCfg",
    "/ISAPI/AccessControl/ShiftWeekPlanCfg",
  ];

  for (const ep of configEndpoints) {
    try {
      const { json, raw } = await hik._get(ep);
      console.log(`✅ SUPPORTED  ${ep}`);
      console.log(`   → ${JSON.stringify(json || raw).slice(0, 500)}\n`);
    } catch (err) {
      // _get throws on 4xx — that means the endpoint doesn't exist or isn't supported
      const status = err.message.match(/→ (\d+)/)?.[1] || "error";
      console.log(`❌ [${status}]  ${ep}`);
    }
  }

  // ── 2. Fetch raw events and dump ALL fields ──
  console.log("\n── 2. Raw event fields from today ──\n");

  try {
    const data = await hik._postJson("/ISAPI/AccessControl/AcsEvent", {
      AcsEventCond: {
        searchID: "attendance-check",
        searchResultPosition: 0,
        maxResults: 5,
        major: 5,
        minor: 0,
        startTime: `${today}T00:00:00+03:00`,
        endTime: `${today}T23:59:59+03:00`,
      },
    });

    const events = data.AcsEvent?.InfoList || [];
    console.log(`Found ${events.length} events. Dumping ALL fields:\n`);

    for (let i = 0; i < Math.min(events.length, 5); i++) {
      const evt = events[i];
      console.log(`── Event ${i + 1} ──`);
      console.log(`  employeeNo: ${evt.employeeNoString || evt.employeeNo || "—"}`);
      console.log(`  name: ${evt.name || "—"}`);
      console.log(`  time: ${evt.time || "—"}`);
      console.log(`  major: ${evt.major}, minor: ${evt.minor}`);
      console.log(`  currentVerifyMode: ${evt.currentVerifyMode || "—"}`);
      console.log(`  ★ attendanceStatus: ${evt.attendanceStatus ?? "NOT PRESENT"}`);
      console.log(`  mask: ${evt.mask || "—"}`);
      console.log(`  doorNo: ${evt.doorNo || "—"}`);

      // Show ALL keys so we don't miss anything
      console.log(`  All keys: ${Object.keys(evt).join(", ")}`);
      console.log();
    }
  } catch (err) {
    console.log(`Error fetching events: ${err.message}`);
  }

  console.log("═══════════════════════════════════════════════════════");
  console.log("  If attendanceStatus shows 'checkIn'/'checkOut',");
  console.log("  we can use it directly instead of guessing!");
  console.log("═══════════════════════════════════════════════════════\n");
}

main().catch(console.error);
